"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { FileText, Download, Brain, Upload, Loader2, AlertCircle, Zap, CheckCircle2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"

export default function PDFSummarizer() {
  const [file, setFile] = useState<File | null>(null)
  const [extractedText, setExtractedText] = useState<string>("")
  const [summary, setSummary] = useState<string>("")
  const [summaryLevel, setSummaryLevel] = useState<"student" | "professor">("student")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentStep, setCurrentStep] = useState("")
  const [keyPhrases, setKeyPhrases] = useState<string[]>([])

  useEffect(() => {
    console.log("Page Component: extractedText length =", extractedText.length, "isProcessing =", isProcessing)
  }, [extractedText, isProcessing])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = event.target.files?.[0]
    console.log("Page Component: File uploaded:", uploadedFile?.name)

    if (uploadedFile && uploadedFile.type === "application/pdf") {
      setExtractedText("")
      setSummary("")
      setKeyPhrases([])
      setProgress(0)
      setCurrentStep("")

      setFile(uploadedFile)
      await extractTextFromPDF(uploadedFile)
    } else if (uploadedFile) {
      setCurrentStep("Error: Please select a valid PDF file")
      console.error("Page Component: Invalid file type selected:", uploadedFile?.type)
    }
  }

  const extractTextFromPDF = async (pdfFile: File) => {
    setIsProcessing(true)
    setCurrentStep("Loading PDF processor...")
    setProgress(10)
    console.log("Page Component: Starting PDF text extraction for:", pdfFile.name)

    try {
      setCurrentStep("Initializing PDF reader...")
      setProgress(20)

      let pdfjsLib = (window as any).pdfjsLib

      if (!pdfjsLib) {
        const script = document.createElement("script")
        script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"

        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log("Page Component: PDF.js CDN script loaded successfully.")
            resolve(null)
          }
          script.onerror = (e) => {
            console.error("Page Component: Failed to load PDF.js CDN script:", e)
            reject(new Error("Failed to load PDF.js library."))
          }
          document.head.appendChild(script)
        })

        pdfjsLib = (window as any).pdfjsLib
        if (!pdfjsLib) {
          throw new Error("PDF.js failed to load after script injection.")
        }

        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        console.log("Page Component: PDF.js worker source set.")
      } else {
        console.log("Page Component: PDF.js already loaded.")
      }

      setCurrentStep("Reading PDF file...")
      setProgress(30)
      console.log("Page Component: Converting PDF to ArrayBuffer...")
      const arrayBuffer = await pdfFile.arrayBuffer()
      console.log("Page Component: ArrayBuffer created. Getting PDF document...")
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      console.log("Page Component: PDF document loaded. Number of pages:", pdf.numPages)

      let fullText = ""
      const numPages = pdf.numPages

      setCurrentStep(`Extracting text from ${numPages} pages...`)

      for (let i = 1; i <= numPages; i++) {
        try {
          const page = await pdf.getPage(i)
          const textContent = await page.getTextContent()
          const pageText = textContent.items
            .filter((item: any) => item.str && typeof item.str === "string")
            .map((item: any) => item.str)
            .join(" ")
          fullText += pageText + " "
          setProgress(30 + (i / numPages) * 40)
          console.log(`Page Component: Extracted text from page ${i}. Current total length: ${fullText.length}`)
        } catch (pageError) {
          console.warn(`Page Component: Error processing page ${i}:`, pageError)
        }
      }

      if (fullText.trim().length === 0) {
        throw new Error("No text could be extracted from the PDF. The PDF might be image-based or encrypted.")
      }

      const cleanedText = fullText
        .replace(/\s+/g, " ")
        .replace(/[^\w\s.,!?;:()\-"']/g, "")
        .trim()

      setExtractedText(cleanedText)
      setProgress(70)
      setCurrentStep("Text extraction completed!")
      console.log("Page Component: Text extracted successfully. Length:", cleanedText.length)
    } catch (error) {
      console.error("Page Component: Error during PDF text extraction:", error)
      setCurrentStep(`Error: ${error instanceof Error ? error.message : "Failed to extract text from PDF"}`)

      try {
        console.log("Page Component: Attempting fallback text extraction...")
        await extractTextFallback(pdfFile)
      } catch (fallbackError) {
        console.error("Page Component: Fallback extraction also failed:", fallbackError)
        setCurrentStep("Error: Could not extract text from PDF. Please try a text-based PDF file.")
      }
    } finally {
      console.log("Page Component: PDF extraction process finished. Setting isProcessing to false.")
      setIsProcessing(false)
    }
  }

  const extractTextFallback = async (pdfFile: File) => {
    setCurrentStep("Trying alternative extraction method...")
    setProgress(40)
    console.log("Page Component: Starting fallback text extraction.")

    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer
          const uint8Array = new Uint8Array(arrayBuffer)

          let text = ""
          for (let i = 0; i < uint8Array.length; i++) {
            const char = uint8Array[i]
            if ((char >= 32 && char <= 126) || char === 10 || char === 13) {
              text += String.fromCharCode(char)
            }
          }

          const cleanedText = text
            .replace(/[^\w\s.,!?;:()\-"']/g, " ")
            .replace(/\s+/g, " ")
            .trim()

          if (cleanedText.length > 100) {
            setExtractedText(cleanedText)
            setProgress(70)
            setCurrentStep("Text extraction completed using fallback method!")
            console.log("Page Component: Fallback extraction successful. Length:", cleanedText.length)
            resolve()
          } else {
            console.warn("Page Component: Fallback extraction: Insufficient text extracted.")
            reject(new Error("Insufficient text extracted from PDF"))
          }
        } catch (error) {
          console.error("Page Component: Error in fallback extraction onload:", error)
          reject(error)
        }
      }

      reader.onerror = (e) => {
        console.error("Page Component: File reading failed during fallback extraction:", e)
        reject(new Error("File reading failed"))
      }
      reader.readAsArrayBuffer(pdfFile)
    })
  }

  const analyzeText = (text: string) => {
    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 15)
    const words = text.toLowerCase().split(/\s+/)

    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "can",
      "this",
      "that",
      "these",
      "those",
      "i",
      "you",
      "he",
      "she",
      "it",
      "we",
      "they",
      "me",
      "him",
      "her",
      "us",
      "them",
      "my",
      "your",
      "his",
      "her",
      "its",
      "our",
      "their",
      "mine",
      "yours",
      "hers",
      "ours",
      "theirs",
      "myself",
      "yourself",
      "himself",
      "herself",
      "itself",
      "ourselves",
      "yourselves",
      "themselves",
      "what",
      "which",
      "who",
      "whom",
      "whose",
      "where",
      "when",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "just",
      "now",
      "here",
      "there",
      "then",
      "also",
      "well",
      "get",
      "go",
      "come",
      "see",
      "know",
      "take",
      "give",
      "use",
      "make",
      "work",
      "call",
      "try",
      "ask",
      "need",
      "feel",
      "become",
      "leave",
      "put",
      "mean",
      "keep",
      "let",
      "begin",
      "seem",
      "help",
      "show",
      "hear",
      "play",
      "run",
      "move",
      "live",
      "believe",
      "bring",
      "happen",
      "write",
      "sit",
      "stand",
      "lose",
      "pay",
      "meet",
      "include",
      "continue",
      "set",
      "learn",
      "change",
      "lead",
      "understand",
      "watch",
      "follow",
      "stop",
      "create",
      "speak",
      "read",
      "spend",
      "grow",
      "open",
      "walk",
      "win",
      "teach",
      "offer",
      "remember",
      "consider",
      "appear",
      "buy",
      "serve",
      "die",
      "send",
      "build",
      "stay",
      "fall",
      "cut",
      "reach",
      "kill",
      "remain",
    ])

    const wordFreq: { [key: string]: number } = {}
    words.forEach((word) => {
      const cleanWord = word.replace(/[^\w]/g, "").toLowerCase()
      if (
        cleanWord.length >= 4 &&
        !stopWords.has(cleanWord) &&
        !/^\d+$/.test(cleanWord) &&
        !/^[^a-z]*$/.test(cleanWord)
      ) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1
      }
    })

    const meaningfulWords = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= 2 && word.length >= 4)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 12)
      .map(([word]) => word)

    const academicTerms = meaningfulWords.filter((word) => {
      const academicPatterns = [
        /tion$/,
        /sion$/,
        /ment$/,
        /ness$/,
        /ity$/,
        /ism$/,
        /ogy$/,
        /ics$/,
        /analysis/,
        /research/,
        /study/,
        /method/,
        /theory/,
        /concept/,
        /process/,
        /system/,
        /model/,
        /approach/,
        /framework/,
        /principle/,
      ]
      return academicPatterns.some((pattern) => pattern.test(word))
    })

    const topWords = [...new Set([...academicTerms, ...meaningfulWords])].slice(0, 8)

    return { sentences, wordFreq, topWords }
  }

  const generateIntelligentSummary = (text: string): { summary: string; keyPhrases: string[] } => {
    const { sentences, wordFreq, topWords } = analyzeText(text)

    if (sentences.length === 0) {
      return { summary: "Unable to generate summary from the extracted text.", keyPhrases: [] }
    }

    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0
      const words = sentence.toLowerCase().split(/\s+/)
      const wordCount = words.length

      if (index < sentences.length * 0.15) score += 4
      if (index > sentences.length * 0.85) score += 3
      if (index >= sentences.length * 0.4 && index <= sentences.length * 0.6) score += 2

      if (wordCount >= 10 && wordCount <= 30) score += 3
      if (wordCount >= 15 && wordCount <= 25) score += 2

      let keywordCount = 0
      words.forEach((word) => {
        const cleanWord = word.replace(/[^\w]/g, "")
        if (topWords.includes(cleanWord)) {
          keywordCount++
          score += 1
        }
      })

      const importantPhrases = [
        "in conclusion",
        "to summarize",
        "the main",
        "key finding",
        "important",
        "significant",
        "research shows",
        "study reveals",
        "analysis indicates",
        "results suggest",
        "evidence shows",
        "data indicates",
        "findings demonstrate",
        "conclusion",
        "therefore",
        "however",
        "furthermore",
        "moreover",
        "consequently",
        "thus",
        "first",
        "second",
        "third",
        "finally",
        "primary",
        "secondary",
        "essential",
        "critical",
        "major",
        "fundamental",
        "central",
        "core",
        "main point",
        "key aspect",
      ]

      const lowerSentence = sentence.toLowerCase()
      importantPhrases.forEach((phrase) => {
        if (lowerSentence.includes(phrase)) {
          score += phrase.length > 10 ? 3 : 2
        }
      })

      const specialCharCount = (sentence.match(/[0-9@#$%^&*()]/g) || []).length
      if (specialCharCount > wordCount * 0.4) score -= 2

      if (wordCount < 8 || wordCount > 35) score -= 1

      const questionWords = ["what", "how", "why", "when", "where", "who", "which"]
      questionWords.forEach((qword) => {
        if (lowerSentence.includes(qword)) score += 1
      })

      return { sentence: sentence.trim(), score, index, wordCount }
    })

    let numSentences: number
    if (summaryLevel === "professor") {
      numSentences = Math.min(12, Math.max(4, Math.floor(sentences.length * 0.2)))
    } else {
      numSentences = Math.min(8, Math.max(3, Math.floor(sentences.length * 0.15)))
    }

    const topSentences = scoredSentences
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, numSentences)
      .sort((a, b) => a.index - b.index)

    if (topSentences.length === 0) {
      return { summary: "Unable to generate a meaningful summary from the extracted text.", keyPhrases: [] }
    }

    const summaryText = topSentences.map((item) => item.sentence).join(". ") + "."

    const extractedPhrases = topWords.slice(0, 8)

    return { summary: summaryText, keyPhrases: extractedPhrases }
  }

  const generateSummary = async () => {
    if (!extractedText) {
      console.warn("Page Component: Attempted to generate summary but no text was extracted.")
      setCurrentStep("Error: No text available for summarization. Please upload a PDF first.")
      return
    }

    setIsProcessing(true)
    setCurrentStep("Analyzing document structure...")
    setProgress(75)
    console.log("Page Component: Starting summary generation.")

    try {
      setCurrentStep("Performing intelligent text analysis...")
      setProgress(85)

      const { summary: intelligentSummary, keyPhrases: extractedPhrases } = generateIntelligentSummary(extractedText)

      setCurrentStep("Formatting summary...")
      setProgress(95)

      let finalSummary: string
      if (summaryLevel === "professor") {
        finalSummary = `Academic Summary (Nivıskar Analysis):\n\n${intelligentSummary}\n\nThis summary was generated by Nivıskar using advanced natural language processing techniques including sentence scoring, keyword analysis, and structural analysis to identify the most important content for academic review.`
      } else {
        finalSummary = `Student Summary (Nivıskar Analysis):\n\n${intelligentSummary}\n\nThis summary was created by Nivıskar using intelligent text analysis to help you quickly understand the main concepts and key points of the document.`
      }

      setSummary(finalSummary)
      setKeyPhrases(extractedPhrases)
      setProgress(100)
      setCurrentStep("Intelligent summary generated successfully!")
      console.log("Page Component: Summary generated successfully. Summary length:", finalSummary.length)
    } catch (error) {
      console.error("Page Component: Summary generation failed:", error)
      setCurrentStep("Error: Could not generate summary. Please try again.")
    } finally {
      console.log("Page Component: Summary generation process finished. Setting isProcessing to false.")
      setIsProcessing(false)
    }
  }

  const downloadAsTXT = () => {
    let content = summary
    if (keyPhrases.length > 0) {
      content += `\n\n--- Key Terms ---\n${keyPhrases.join(", ")}`
    }

    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `summary_${summaryLevel}_${Date.now()}.txt`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const downloadAsPDF = async () => {
    const { jsPDF } = await import("jspdf")
    const doc = new jsPDF()

    doc.setFontSize(16)
    doc.text(`PDF Summary (${summaryLevel.charAt(0).toUpperCase() + summaryLevel.slice(1)} Level)`, 20, 20)

    doc.setFontSize(12)
    const splitText = doc.splitTextToSize(summary, 170)
    let yPosition = 40
    doc.text(splitText, 20, yPosition)

    if (keyPhrases.length > 0) {
      yPosition += splitText.length * 5 + 10
      doc.setFontSize(14)
      doc.text("Key Terms:", 20, yPosition)
      yPosition += 10
      doc.setFontSize(11)
      const keyPhrasesText = keyPhrases.join(", ")
      const splitKeyPhrases = doc.splitTextToSize(keyPhrasesText, 170)
      doc.text(splitKeyPhrases, 20, yPosition)
    }

    doc.setFontSize(10)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 280)

    doc.save(`summary_${summaryLevel}_${Date.now()}.pdf`)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-2/10 to-background p-4 transition-colors duration-[10ms]">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 relative">
          {/* Dark Mode Toggle */}
          <div className="absolute top-0 right-0">
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-center gap-2">
            <Brain className="w-8 h-8 text-accent-1 transition-colors duration-[10ms]" />
            <h1 className="text-3xl font-bold text-foreground transition-colors duration-[10ms]">Nivıskar</h1>
          </div>
          <p className="text-muted-foreground transition-colors duration-[10ms]">
            Advanced PDF summarization AI powered by intelligent algorithms
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-accent-1" />
              Upload PDF Document
            </CardTitle>
            <CardDescription>Select a PDF file to extract text and generate an intelligent summary</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pdf-upload">Choose PDF File</Label>
              <Input id="pdf-upload" type="file" accept=".pdf" onChange={handleFileUpload} className="cursor-pointer" />
            </div>

            {file && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 p-3 bg-accent-1/10 rounded-lg dark:bg-accent-1/20 dark:text-accent-1-foreground">
                  <FileText className="w-5 h-5 text-accent-1" />
                  <span className="text-sm text-foreground">{file.name}</span>
                  <Badge variant="secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</Badge>
                </div>

                {currentStep.includes("Error") && (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg dark:bg-destructive/20 dark:border-destructive/40">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                      <div>
                        <p className="text-sm text-destructive">{currentStep}</p>
                        <p className="text-xs text-destructive/80 mt-1">
                          Please ensure your PDF contains selectable text (not scanned images).
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="summary-level">Summary Level</Label>
              <Select value={summaryLevel} onValueChange={(value: "student" | "professor") => setSummaryLevel(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select summary level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student Level - Simplified and concise</SelectItem>
                  <SelectItem value="professor">Professor Level - Detailed and academic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {extractedText && (
              <Button
                onClick={generateSummary}
                disabled={isProcessing}
                className="w-full bg-accent-1 text-accent-1-foreground hover:bg-accent-1/90"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Generate Intelligent Summary
                  </>
                )}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Progress Section */}
        {isProcessing && (
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{currentStep}</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Extracted Text Preview */}
        {extractedText && (
          <Card>
            <CardHeader>
              <CardTitle>Extracted Text Preview</CardTitle>
              <CardDescription>First 500 characters of the extracted text</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={extractedText.substring(0, 500) + (extractedText.length > 500 ? "..." : "")}
                readOnly
                className="min-h-[100px] resize-none"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Total characters: {extractedText.length.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Key Phrases */}
        {keyPhrases.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Key Terms Identified</CardTitle>
              <CardDescription>Important terms extracted from the document</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {keyPhrases.map((phrase, index) => (
                  <Badge key={index} className="bg-accent-2/20 text-accent-2 border-accent-2/50">
                    {phrase}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Section */}
        {summary && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Generated Summary</span>
                <Badge variant={summaryLevel === "professor" ? "default" : "secondary"}>
                  {summaryLevel.charAt(0).toUpperCase() + summaryLevel.slice(1)} Level
                </Badge>
              </CardTitle>
              <CardDescription>Intelligent summary using advanced NLP analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={summary} readOnly className="min-h-[200px] resize-none" />

              <div className="flex gap-2">
                <Button
                  onClick={downloadAsTXT}
                  variant="outline"
                  className="flex-1 bg-transparent text-accent-1 border-accent-1 hover:bg-accent-1/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download as TXT
                </Button>
                <Button
                  onClick={downloadAsPDF}
                  variant="outline"
                  className="flex-1 bg-transparent text-accent-1 border-accent-1 hover:bg-accent-1/10"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download as PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Advanced Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-accent-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Intelligent Text Analysis
                </h4>
                <p className="text-sm text-muted-foreground">
                  Advanced NLP algorithms for sentence scoring and content analysis
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-accent-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Key Term Extraction
                </h4>
                <p className="text-sm text-muted-foreground">
                  Automatically identifies and extracts important terms and concepts
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-accent-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Context-Aware Summarization
                </h4>
                <p className="text-sm text-muted-foreground">Considers document structure and content importance</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-accent-1 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Privacy-First Processing
                </h4>
                <p className="text-sm text-muted-foreground">All processing happens locally in your browser</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
