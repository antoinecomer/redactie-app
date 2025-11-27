import React, { useState, useMemo } from 'react';

// API Key setup (wordt runtime ingevuld door de omgeving)
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const App = () => {
    const [markdownInput, setMarkdownInput] = useState<string>(
        '# Welkom bij de RedactieApp Studio\n\nDit is een **voorbeeldnieuwsbrief**.\n\n* Typ hier links\n* Zie rechts het resultaat\n\nGebruik de AI-knoppen hierboven om de magie te testen! ✨'
    );

    const [isMobileView, setIsMobileView] = useState<boolean>(true);
    const [isGenerating, setIsGenerating] = useState<boolean>(false);

    // --- GEMINI API INTEGRATIE ---
    const callGemini = async (promptType: 'title' | 'push' | 'shorten') => {
        if (isGenerating) return;
        setIsGenerating(true);

        try {
            let systemPrompt = "";
            let userPrompt = "";

            // Bepaal de prompt op basis van de actie
            switch (promptType) {
                case 'title':
                    systemPrompt = "Je bent een ervaren krantenkop-redacteur. Bedenk 3 pakkende, korte titels/onderwerpregels voor deze nieuwsbrieftekst. Geef alleen de titels, als een lijstje.";
                    userPrompt = `Tekst: ${markdownInput}`;
                    break;
                case 'push':
                    systemPrompt = "Je bent een expert in mobiele notificaties. Herschrijf de kern van deze tekst naar één pakkend pushbericht (max 120 tekens) met een emoji. Begin met 'PUSH:'";
                    userPrompt = `Tekst: ${markdownInput}`;
                    break;
                case 'shorten':
                    systemPrompt = "Je bent een strenge eindredacteur. Herschrijf de volgende tekst zodat deze korter, krachtiger en actiever is, zonder de feitelijke inhoud te verliezen. Behoud Markdown opmaak.";
                    userPrompt = `Tekst: ${markdownInput}`;
                    break;
            }

            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: userPrompt }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] }
                    }),
                }
            );

            const data = await response.json();
            const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (generatedText) {
                if (promptType === 'shorten') {
                    // Bij inkorten vervangen we de tekst
                    setMarkdownInput(generatedText);
                } else {
                    // Bij titels of push voegen we het toe bovenaan
                    setMarkdownInput(`\n\n> **AI Suggestie (${promptType}):**\n${generatedText}\n\n---\n${markdownInput}`);
                }
            }
        } catch (error) {
            console.error("Fout bij aanroepen Gemini:", error);
            alert("Er ging iets mis met de AI generatie. Controleer de console.");
        } finally {
            setIsGenerating(false);
        }
    };

    // --- LOGICA ---
    const toHtml = (markdown: string): string => {
        let html = markdown
            .replace(/^### (.*$)/gim, '<h4>$1</h4>')
            .replace(/^## (.*$)/gim, '<h3>$1</h3>')
            .replace(/^# (.*$)/gim, '<h2>$1</h2>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-blue-500 pl-4 italic bg-blue-50 p-2 my-2">$1</blockquote>'); // Blockquote support voor AI resultaat

        const lines = html.split('\n');
        let inList = false;
        const processedLines: string[] = [];

        lines.forEach(line => {
            if (line.trim().startsWith('*')) {
                const listItemText = line.substring(line.indexOf('*') + 1).trim();
                if (!inList) { inList = true; processedLines.push('<ul><li>' + listItemText + '</li>'); }
                else { processedLines.push('<li>' + listItemText + '</li>'); }
            } else {
                if (inList) { processedLines.push('</ul>'); inList = false; }
                if (line.trim().length > 0) processedLines.push('<p>' + line + '</p>');
            }
        });
        if (inList) processedLines.push('</ul>');
        return processedLines.join('');
    };

    const renderedHtml = useMemo(() => toHtml(markdownInput), [markdownInput]);

    return (
        <div className="p-8 min-h-screen flex flex-col gap-6 bg-gray-50">
            <header className="flex justify-between items-center border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-800">
                    RedactieApp Content Studio
                </h1>
                <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">
                    Powered by Gemini AI ✨
                </span>
            </header>

            {/* AI Toolbar */}
            <div className="flex gap-2 p-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <span className="text-sm font-bold text-gray-400 self-center px-2">AI Assistent:</span>
                <button
                    onClick={() => callGemini('title')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors disabled:opacity-50"
                >
                    {isGenerating ? '...' : '✨ Bedenk Koppen'}
                </button>
                <button
                    onClick={() => callGemini('push')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-md transition-colors disabled:opacity-50"
                >
                    {isGenerating ? '...' : '✨ Maak Pushbericht'}
                </button>
                <button
                    onClick={() => callGemini('shorten')}
                    disabled={isGenerating}
                    className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors disabled:opacity-50"
                >
                    {isGenerating ? '...' : '✨ Korter & Krachtiger'}
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-full flex-grow">
                {/* Editor */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <h2 className="font-bold mb-2 text-gray-700">Editor Input</h2>
                    <textarea
                        className="w-full flex-grow p-4 border rounded-lg shadow-inner font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none min-h-[500px]"
                        value={markdownInput}
                        onChange={(e) => setMarkdownInput(e.target.value)}
                    />
                </div>

                {/* Preview */}
                <div className="w-full lg:w-1/2 flex flex-col items-center">
                    <div className="mb-4 space-x-2 w-full flex justify-center">
                        <button
                            onClick={() => setIsMobileView(true)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${isMobileView ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Mobiel
                        </button>
                        <button
                            onClick={() => setIsMobileView(false)}
                            className={`px-3 py-1 rounded text-sm font-medium transition-all ${!isMobileView ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                        >
                            Desktop
                        </button>
                    </div>

                    <div className={`${isMobileView ? 'w-[375px] border-8 border-gray-800 rounded-[3rem]' : 'w-full border rounded-xl'} bg-white shadow-2xl overflow-hidden min-h-[600px] transition-all duration-500 relative`}>
                        {/* Fake Phone Status Bar for Mobile View */}
                        {isMobileView && (
                            <div className="h-6 bg-gray-800 w-full absolute top-0 left-0 z-10 flex justify-center">
                                <div className="h-4 w-32 bg-black rounded-b-xl"></div>
                            </div>
                        )}
                        <div className={`h-full overflow-y-auto ${isMobileView ? 'pt-8 p-4' : 'p-8'} prose prose-sm max-w-none prose-h2:text-blue-600 prose-a:text-blue-500`} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
