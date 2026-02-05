export const handleStream = async (response, setDiffs, setStatus, setIsComparing) => {
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        // Retrieve everything except the last part (which might be incomplete)
        buffer = lines.pop()

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6)
                try {
                    const data = JSON.parse(jsonStr)

                    if (data.status) {
                        setStatus(data.status)
                        if (data.status === 'Comparison complete.') {
                            setIsComparing(false)
                        }
                    } else {
                        setDiffs(prev => [...prev, data])
                    }
                } catch (e) {
                    console.error('Failed to parse SSE line', line, e)
                }
            }
        }
    }
}
