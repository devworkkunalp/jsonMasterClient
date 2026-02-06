// Text Diff Web Worker
self.onmessage = async (e) => {
    const { file1, file2 } = e.data;
    
    try {
        self.postMessage({ type: 'PROGRESS', message: 'Reading source file...' });
        const sourceText = await file1.text();
        const sourceLines = sourceText.split(/\r?\n/);
        
        self.postMessage({ type: 'PROGRESS', message: 'Reading target file...' });
        const targetText = await file2.text();
        const targetLines = targetText.split(/\r?\n/);

        const totalLines = Math.max(sourceLines.length, targetLines.length);
        let totalDifferences = 0;

        self.postMessage({ type: 'PROGRESS', message: 'Comparing lines...' });

        // For very large files, we store the processed lines to serve them
        const processedLines = [];

        for (let i = 0; i < totalLines; i++) {
            const sLine = i < sourceLines.length ? sourceLines[i] : null;
            const tLine = i < targetLines.length ? targetLines[i] : null;

            const isDifferent = sLine !== tLine;
            if (isDifferent) totalDifferences++;

            let changeType = "same";
            if (sLine === null && tLine !== null) changeType = "added";
            else if (sLine !== null && tLine === null) changeType = "removed";
            else if (isDifferent) changeType = "modified";

            processedLines.push({
                index: i,
                source: sLine !== null ? {
                    lineNumber: i + 1,
                    content: truncateLine(sLine, 2000),
                    changeType: changeType === "added" ? "added" : changeType // added lines in source are empty space, handled in UI
                } : null,
                target: tLine !== null ? {
                    lineNumber: i + 1,
                    content: truncateLine(tLine, 2000),
                    changeType: changeType === "removed" ? "removed" : changeType
                } : null
            });

            // Report progress every 50k lines
            if (i % 50000 === 0) {
                self.postMessage({ 
                    type: 'PROGRESS', 
                    message: `Comparing... (${Math.round((i/totalLines)*100)}%)` 
                });
            }
        }

        const stats = {
            totalLines,
            totalDifferences,
            sourceSize: file1.size,
            targetSize: file2.size,
            totalPages: 1 // In standalone we can just send the whole thing if memory allows, or keep it for UI compatibility
        };

        self.postMessage({ type: 'COMPLETE', stats, processedLines });

    } catch (error) {
        self.postMessage({ type: 'ERROR', error: error.message });
    }
};

function truncateLine(line, maxLength) {
    if (line.length <= maxLength) return line;
    return line.substring(0, maxLength) + "... (truncated)";
}
