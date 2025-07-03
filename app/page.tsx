"use client"

import Link from "next/link"
import { useState, useEffect, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Copy,
  RefreshCw,
  Shield,
  Eye,
  EyeOff,
  Download,
  History,
  Info,
  CheckCircle,
  Settings,
  Mail,
  Globe,
  Github,
} from "lucide-react"
import { toast } from 'sonner'
import { usePasswordGenerator } from "@/hooks/use-password-generator"
import { usePasswordHistory } from "@/hooks/use-password-history"
import { WORD_CATEGORIES, type WordCategory } from "@/lib/word-lists"
import { getPasswordComplexity } from "@/lib/password-analysis"

interface PasswordOptions {
  wordCount: number
  includeCapitals: boolean
  includeNumbers: boolean
  wordCategory: WordCategory
  minWordLength: number
  maxWordLength: number
  numberDensity: number
  avoidSimilarWords: boolean
}

export default function PasswordGenerator() {
  const [options, setOptions] = useState<PasswordOptions>({
    wordCount: 3,
    includeCapitals: true,
    includeNumbers: true,
    wordCategory: "mixed",
    minWordLength: 5,
    maxWordLength: 12,
    numberDensity: 0.7,
    avoidSimilarWords: true,
  })

  const [showPassword, setShowPassword] = useState(true)
  const [showAdvanced, setShowAdvanced] = useState(false)

  const { password, generatePassword, updatePasswordWithOptions, isGenerating } = usePasswordGenerator(options)
  const { history, addToHistory, clearHistory } = usePasswordHistory()

  const passwordAnalysis = useMemo(() => {
    if (!password) return null
    return {
      complexity: getPasswordComplexity(password),
    }
  }, [password])

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword()
    if (newPassword) {
      addToHistory(newPassword, options)
    }
  }, [generatePassword, addToHistory, options])

  const handleOptionsChange = useCallback(
    (newOptions: Partial<PasswordOptions>) => {
      const updatedOptions = { ...options, ...newOptions }
      setOptions(updatedOptions)

      // Update existing password with the NEW options immediately
      if (password) {
        updatePasswordWithOptions(updatedOptions)
      }
    },
    [options, password, updatePasswordWithOptions],
  )

  // Generate initial password
  useEffect(() => {
    handleGenerate()
  }, [])

  // Auto-generate when word count changes
  useEffect(() => {
    handleGenerate()
  }, [options.wordCount])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(password)
      toast.success("Password has been copied to your clipboard.")
    } catch (err) {
      toast.error("Unable to copy password to clipboard.")
    }
  }

  const exportPasswords = () => {
    const data = {
      passwords: history,
      exportDate: new Date().toISOString(),
      generator: "SecureWords Pro",
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `passwords-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getStrengthColor = (strength: number) => {
    if (strength < 30) return "bg-red-500"
    if (strength < 60) return "bg-yellow-500"
    if (strength < 80) return "bg-blue-500"
    return "bg-green-500"
  }

  const getStrengthLabel = (strength: number) => {
    if (strength < 30) return "Weak"
    if (strength < 60) return "Fair"
    if (strength < 80) return "Good"
    return "Strong"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">SecureWords</h1>
          </div>
          <p className="text-slate-600 text-lg">Generate memorable yet secure passwords using dictionary words</p>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Password Generator
                </CardTitle>
                <CardDescription>Create strong, memorable passwords using real words</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generated Password Display */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Generated Password</Label>
                  <div className="relative">
                    <div className="flex items-center gap-2 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                      <code className="flex-1 text-lg font-mono break-all">
                        {showPassword ? password : "•".repeat(password.length)}
                      </code>
                      <Button variant="ghost" size="sm" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={copyToClipboard}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Password Strength */}
                  {passwordAnalysis && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Password Strength</Label>
                        <Badge
                          variant="secondary"
                          className={`${getStrengthColor(passwordAnalysis.complexity.score)} text-white`}
                        >
                          {getStrengthLabel(passwordAnalysis.complexity.score)}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordAnalysis.complexity.score)}`}
                          style={{ width: `${passwordAnalysis.complexity.score}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Controls */}
                <div className="space-y-6">
                  {/* Word Count Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Number of Words</Label>
                      <Badge variant="outline">{options.wordCount} words</Badge>
                    </div>
                    <Slider
                      value={[options.wordCount]}
                      onValueChange={(value) => setOptions((prev) => ({ ...prev, wordCount: value[0] }))}
                      min={2}
                      max={4}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>2 words</span>
                      <span>4 words</span>
                    </div>
                  </div>

                  {/* Main Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Capital Letters</Label>
                        <p className="text-xs text-slate-500">Capitalize first letter of each word</p>
                      </div>
                      <Switch
                        checked={options.includeCapitals}
                        onCheckedChange={(checked) => handleOptionsChange({ includeCapitals: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">Include Numbers</Label>
                        <p className="text-xs text-slate-500">Add random numbers within words</p>
                      </div>
                      <Switch
                        checked={options.includeNumbers}
                        onCheckedChange={(checked) => handleOptionsChange({ includeNumbers: checked })}
                      />
                    </div>
                  </div>

                  {/* Advanced Options Toggle */}
                  <div className="flex items-center justify-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      {showAdvanced ? "Hide" : "Show"} Advanced Options
                    </Button>
                  </div>

                  {/* Advanced Options */}
                  {showAdvanced && (
                    <Card className="p-4 bg-slate-50">
                      <div className="space-y-4">
                        {/* Word Category */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Word Category</Label>
                          <Select
                            value={options.wordCategory}
                            onValueChange={(value: WordCategory) => handleOptionsChange({ wordCategory: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mixed">Mixed (Recommended)</SelectItem>
                              <SelectItem value="common">Common Words</SelectItem>
                              <SelectItem value="nature">Nature & Animals</SelectItem>
                              <SelectItem value="technology">Technology</SelectItem>
                              <SelectItem value="abstract">Abstract Concepts</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Word Length Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Min Word Length</Label>
                            <Slider
                              value={[options.minWordLength]}
                              onValueChange={(value) => handleOptionsChange({ minWordLength: value[0] })}
                              min={4}
                              max={8}
                              step={1}
                            />
                            <div className="text-xs text-slate-500">{options.minWordLength} characters</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Max Word Length</Label>
                            <Slider
                              value={[options.maxWordLength]}
                              onValueChange={(value) => handleOptionsChange({ maxWordLength: value[0] })}
                              min={8}
                              max={15}
                              step={1}
                            />
                            <div className="text-xs text-slate-500">{options.maxWordLength} characters</div>
                          </div>
                        </div>

                        {/* Number Density */}
                        {options.includeNumbers && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Number Density</Label>
                            <Slider
                              value={[options.numberDensity * 100]}
                              onValueChange={(value) => handleOptionsChange({ numberDensity: value[0] / 100 })}
                              min={20}
                              max={100}
                              step={10}
                            />
                            <div className="text-xs text-slate-500">
                              {Math.round(options.numberDensity * 100)}% of words will contain numbers
                            </div>
                          </div>
                        )}

                        {/* Additional Options */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">Avoid Similar Words</Label>
                            <p className="text-xs text-slate-500">Prevent phonetically similar words</p>
                          </div>
                          <Switch
                            checked={options.avoidSimilarWords}
                            onCheckedChange={(checked) => handleOptionsChange({ avoidSimilarWords: checked })}
                          />
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                {/* Generate Button */}
                <Button
                  onClick={handleGenerate}
                  className="w-full h-12 text-lg font-medium"
                  size="lg"
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      Generate New Password
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="text-center text-sm text-slate-500 space-y-1">
                  <p>Passwords are generated locally and never stored or transmitted.</p>
                  <p>Using {WORD_CATEGORIES[options.wordCategory].length} carefully selected dictionary words.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Password History
                    </CardTitle>
                    <CardDescription>Your recently generated passwords</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportPasswords} disabled={history.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button variant="outline" onClick={clearHistory} disabled={history.length === 0}>
                      Clear All
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No passwords generated yet</p>
                    <p className="text-sm">Generated passwords will appear here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] w-full">
                    <div className="space-y-3 pr-4">
                      {history.map((entry, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex-1">
                            <code className="text-sm font-mono">{entry.password}</code>
                            <div className="text-xs text-slate-500 mt-1">
                              {entry.timestamp.toLocaleString()} • {entry.options.wordCount} words
                              {entry.options.includeCapitals && " • Capitals"}
                              {entry.options.includeNumbers && " • Numbers"}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(entry.password)
                              toast.success("Password copied to clipboard.")
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="about" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  About SecureWords
                </CardTitle>
                <CardDescription>Professional password generator for secure, memorable passwords</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Security Information</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>Passwords generated:</span>
                        <span className="font-mono">{history.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Available words:</span>
                        <span className="font-mono">{WORD_CATEGORIES[options.wordCategory].length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Word range:</span>
                        <span className="font-mono">
                          {options.minWordLength}-{options.maxWordLength} chars
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">Privacy & Security</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Generated locally</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>No data transmitted</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Cryptographically secure</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>No external dependencies</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Separator />

                <div className="text-center space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">SecureWords</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      A professional password generator that creates memorable yet secure passwords using dictionary
                      words. Perfect balance between security and usability.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold">Contact & Support</h4>
                    <div className="flex justify-center gap-6">
                      {/* <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Mail className="h-4 w-4" />
                        <span>support@example.com</span>
                      </div> */}
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Github className="h-4 w-4" />
                        <span>
                          <Link 
                            href="https://github.com/r4sheed" 
                            className="hover:underline underline-offset-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            GitHub
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500">
                      Version 1.0.0 • Built with {" "}
                      <Link
                        href="https://nextjs.org/"
                        className="underline underline-offset-2 hover:text-blue-600 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Next.js
                      </Link>
                      {" "} &{" "}
                      <Link
                        href="https://ui.shadcn.com/"
                        className="underline underline-offset-2 hover:text-blue-600 transition-colors"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        shadcn/ui
                      </Link>
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="text-center p-4">
            <Shield className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <h3 className="font-semibold mb-1">Secure</h3>
            <p className="text-sm text-slate-600">Cryptographically secure random generation</p>
          </Card>
          <Card className="text-center p-4">
            <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <h3 className="font-semibold mb-1">Memorable</h3>
            <p className="text-sm text-slate-600">Real words are easier to remember</p>
          </Card>
          <Card className="text-center p-4">
            <RefreshCw className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <h3 className="font-semibold mb-1">Customizable</h3>
            <p className="text-sm text-slate-600">Adjust length and complexity to your needs</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
