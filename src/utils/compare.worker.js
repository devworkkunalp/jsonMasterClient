// Smart Compare Web Worker
self.onmessage = async (e) => {
    const { file1, file2, keyField, ignoredFields } = e.data;
    
    try {
        const ignoredSet = new Set(
            ignoredFields ? ignoredFields.split(',').map(s => s.trim().toLowerCase()).filter(s => s) : []
        );

        // Read and parse files in the worker to keep UI thread smooth
        self.postMessage({ type: 'PROGRESS', message: 'Reading and parsing files...' });
        
        const sourceText = await file1.text();
        const targetText = await file2.text();
        
        let source = JSON.parse(sourceText);
        let target = JSON.parse(targetText);

        // Auto-detect array if wrapped in an object
        const findArray = (obj) => {
            if (Array.isArray(obj)) return obj;
            if (obj && typeof obj === 'object') {
                for (const key in obj) {
                    if (Array.isArray(obj[key])) return obj[key];
                }
            }
            return null;
        };

        const sourceArray = findArray(source);
        const targetArray = findArray(target);

        if (!sourceArray || !targetArray) {
            throw new Error("Could not find an array of items to compare in one or both files.");
        }

        const result = {
            modified: [],
            added: [],
            removed: [],
            unchanged: [],
            summary: {
                totalRecords: 0,
                modifiedCount: 0,
                addedCount: 0,
                removedCount: 0,
                unchangedCount: 0
            }
        };

        self.postMessage({ type: 'PROGRESS', message: 'Comparing records...' });

        // Group by keyField
        const sourceGroups = groupBy(sourceArray, keyField);
        const targetGroups = groupBy(targetArray, keyField);

        const allKeys = new Set([...Object.keys(sourceGroups), ...Object.keys(targetGroups)]);
        result.summary.totalRecords = allKeys.size;

        for (const key of allKeys) {
            const sourceItems = sourceGroups[key] || [];
            const targetItems = targetGroups[key] || [];

            const maxCount = Math.max(sourceItems.length, targetItems.length);

            for (let i = 0; i < maxCount; i++) {
                const src = sourceItems[i];
                const tgt = targetItems[i];

                if (src && tgt) {
                    const differences = compareObjects(src, tgt, "", ignoredSet);
                    if (differences.length > 0) {
                        result.modified.push({
                            keyValue: key,
                            source: src,
                            target: tgt,
                            differences: differences
                        });
                    } else {
                        result.unchanged.push(src);
                    }
                } else if (src) {
                    result.removed.push(src);
                } else if (tgt) {
                    result.added.push(tgt);
                }
            }
        }

        result.summary.modifiedCount = result.modified.length;
        result.summary.addedCount = result.added.length;
        result.summary.removedCount = result.removed.length;
        result.summary.unchangedCount = result.unchanged.length;
        result.summary.totalRecords = result.modified.length + result.added.length + result.removed.length + result.unchanged.length;

        self.postMessage({ type: 'COMPLETE', result });
    } catch (error) {
        self.postMessage({ type: 'ERROR', error: error.message });
    }
};

function groupBy(array, key) {
    if (!Array.isArray(array)) return {};
    return array.reduce((acc, obj) => {
        const val = obj[key] !== undefined ? String(obj[key]) : "no-key";
        if (!acc[val]) acc[val] = [];
        acc[val].push(obj);
        return acc;
    }, {});
}

function compareObjects(source, target, basePath, ignoredSet) {
    const differences = [];
    const allKeys = new Set([...Object.keys(source), ...Object.keys(target)]);

    for (const key of allKeys) {
        if (ignoredSet.has(key.toLowerCase())) continue;

        const path = basePath ? `${basePath}.${key}` : key;
        const sourceValue = source[key];
        const targetValue = target[key];

        if (sourceValue !== undefined && targetValue === undefined) {
            differences.push({ path, sourceValue, targetValue: null, changeType: "removed" });
        } else if (sourceValue === undefined && targetValue !== undefined) {
            differences.push({ path, sourceValue: null, targetValue, changeType: "added" });
        } else if (sourceValue !== targetValue) {
            if (isObject(sourceValue) && isObject(targetValue)) {
                differences.push(...compareObjects(sourceValue, targetValue, path, ignoredSet));
            } else if (Array.isArray(sourceValue) && Array.isArray(targetValue)) {
                if (JSON.stringify(sourceValue) !== JSON.stringify(targetValue)) {
                    differences.push({ path, sourceValue, targetValue, changeType: "modified" });
                }
            } else if (sourceValue !== targetValue) {
                differences.push({ path, sourceValue, targetValue, changeType: "modified" });
            }
        }
    }
    return differences;
}

function isObject(val) {
    return val && typeof val === 'object' && !Array.isArray(val);
}
