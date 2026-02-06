import { useState, useMemo, useEffect } from 'react'
import { DesktopCompareView } from './SmartCompare/DesktopCompareView'
import { MobileCompareView } from './SmartCompare/MobileCompareView'

export default function SmartCompare({ theme }) {
    const [file1, setFile1] = useState(null)
    const [file2, setFile2] = useState(null)
    const [keyField, setKeyField] = useState('id') 
    const [ignoredFields, setIgnoredFields] = useState('')
    const [result, setResult] = useState(null)
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [filter, setFilter] = useState('all') // 'all', 'modified', 'added', 'removed'
    const [visibleCount, setVisibleCount] = useState(50)
    const [searchTerm, setSearchTerm] = useState('')

    const monacoTheme = 'vs'

    useEffect(() => {
        setVisibleCount(50)
        setSelectedIndex(0)
    }, [result, filter, searchTerm])

    const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const [loadingMessage, setLoadingMessage] = useState('')

    const handleCompare = async () => {
        if (!file1 || !file2) {
            setError('Please select both files')
            return
        }

        setLoading(true)
        setError(null)
        setResult(null)
        setLoadingMessage('Initializing worker...')

        try {
            const worker = new Worker(new URL('../utils/compare.worker.js', import.meta.url), { type: 'module' });

            worker.onmessage = (e) => {
                const { type, result, message, error } = e.data;
                if (type === 'PROGRESS') {
                    setLoadingMessage(message);
                } else if (type === 'COMPLETE') {
                    setResult(result);
                    setLoading(false);
                    setLoadingMessage('');
                    worker.terminate();
                } else if (type === 'ERROR') {
                    setError(`Worker Error: ${error}`);
                    setLoading(false);
                    setLoadingMessage('');
                    worker.terminate();
                }
            };

            worker.onerror = (err) => {
                setError(`Worker caught error: ${err.message}`);
                setLoading(false);
                setLoadingMessage('');
                worker.terminate();
            };

            worker.postMessage({
                file1,
                file2,
                keyField,
                ignoredFields
            });

        } catch (err) {
            setError(`Error: ${err.message}`)
            setLoading(false)
            setLoadingMessage('')
        }
    }

    const filteredRecords = useMemo(() => {
        if (!result) return []

        const mapItem = (item, type, index) => {
            const kv = item.keyValue || 'N/A';
            return {
                ...item,
                type,
                displayKeyValue: kv,
                label: kv !== 'N/A' ? `${keyField}: ${kv}` : `${type.toUpperCase()} #${index + 1}`
            };
        }

        const modified = (result.modified || []).map((i, idx) => mapItem(i, 'modified', idx))
        const added = (result.added || []).map((i, idx) => mapItem(i, 'added', idx))
        const removed = (result.removed || []).map((i, idx) => mapItem(i, 'removed', idx))

        let list = []
        if (filter === 'all') list = [...modified, ...added, ...removed]
        else if (filter === 'modified') list = modified
        else if (filter === 'added') list = added
        else if (filter === 'removed') list = removed
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            list = list.filter(item => 
                item.label.toLowerCase().includes(term) ||
                (item.keyValue && item.keyValue.toString().toLowerCase().includes(term))
            );
        }

        return list
    }, [result, filter, keyField, searchTerm])

    const currentRecord = filteredRecords[selectedIndex]

    const originalJson = currentRecord?.source ? JSON.stringify(currentRecord.source, null, 2) : ''
    const modifiedJson = currentRecord?.target ? JSON.stringify(currentRecord.target, null, 2) : ''

    const handleDownloadReport = () => {
        if (!result) return

        const report = {
            summary: result.summary,
            sourceFile: file1?.name,
            targetFile: file2?.name,
            keyField: keyField,
            generatedAt: new Date().toLocaleString(),
            changes: filteredRecords.map(item => {
                const base = {
                    status: item.type.toUpperCase(),
                    [keyField]: item.keyValue || 'N/A'
                };

                if (item.type === 'modified') {
                    return {
                        ...base,
                        differences: item.differences?.map(d => ({
                            path: d.path,
                            sourceValue: d.sourceValue,
                            targetValue: d.targetValue
                        }))
                    };
                } else if (item.type === 'added') {
                    return { ...base, message: 'New record added to target file.' };
                } else {
                    return { ...base, message: 'Record removed from target file.' };
                }
            })
        }

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `smart-comparison-report-${new Date().getTime()}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const isCompactMode = !!result

    return (
        <div className="h-full flex flex-col bg-white transition-colors duration-300">
            {isMobile ? (
                <MobileCompareView
                    isCompactMode={isCompactMode}
                    file1={file1}
                    setFile1={setFile1}
                    file2={file2}
                    setFile2={setFile2}
                    keyField={keyField}
                    setKeyField={setKeyField}
                    ignoredFields={ignoredFields}
                    setIgnoredFields={setIgnoredFields}
                    handleCompare={handleCompare}
                    loading={loading}
                    loadingMessage={loadingMessage}
                    result={result}
                    handleDownloadReport={handleDownloadReport}
                    setResult={setResult}
                />
            ) : (
                <DesktopCompareView
                    isCompactMode={isCompactMode}
                    file1={file1}
                    setFile1={setFile1}
                    file2={file2}
                    setFile2={setFile2}
                    keyField={keyField}
                    setKeyField={setKeyField}
                    ignoredFields={ignoredFields}
                    setIgnoredFields={setIgnoredFields}
                    handleCompare={handleCompare}
                    loading={loading}
                    loadingMessage={loadingMessage}
                    result={result}
                    filter={filter}
                    setFilter={setFilter}
                    handleDownloadReport={handleDownloadReport}
                    setResult={setResult}
                    error={error}
                    filteredRecords={filteredRecords}
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedIndex={selectedIndex}
                    setSelectedIndex={setSelectedIndex}
                    visibleCount={visibleCount}
                    setVisibleCount={setVisibleCount}
                    currentRecord={currentRecord}
                    originalJson={originalJson}
                    modifiedJson={modifiedJson}
                    monacoTheme={monacoTheme}
                    isMobile={isMobile}
                />
            )}
        </div>
    );
}
