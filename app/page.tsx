"use client"

import Link from "next/link"
import { useTranslations } from 'next-intl';
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
  Github,
} from "lucide-react"
import { toast } from 'sonner'
import { defaultLocale } from "@/i18n/config";
import { usePasswordGenerator } from "@/hooks/use-password-generator"
import { usePasswordHistory } from "@/hooks/use-password-history"
import { WORD_CATEGORIES, type WordCategory } from "@/lib/word-lists"
import { getPasswordComplexity, getStrengthColor, getStrengthWidth } from "@/lib/password-analysis"

interface PasswordOptions {
  wordCount: number
  includeCapitals: boolean
  includeNumbers: boolean
  includeSpecials: boolean
  wordCategory: WordCategory
  minWordLength: number
  maxWordLength: number
  characterDensity: number
  avoidSimilarWords: boolean
}

export default function PasswordGenerator() {
  const t = useTranslations("page");
  const [options, setOptions] = useState<PasswordOptions>({
    wordCount: 3,
    includeCapitals: true,
    includeNumbers: true,
    includeSpecials: false,
    wordCategory: "mixed",
    minWordLength: 5,
    maxWordLength: 12,
    characterDensity: 0.7,
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

  // Auto-generate when word count changes
  useEffect(() => {
    handleGenerate()
  }, [options.wordCount])

  const copyToClipboard = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(password)
      } else {
        // Fallback for insecure context or missing clipboard API
        const textarea = document.createElement("textarea")
        textarea.value = password
        textarea.style.position = "fixed" // Prevent scrolling to bottom
        textarea.style.opacity = "0"
        document.body.appendChild(textarea)
        textarea.focus()
        textarea.select()
        try {
          document.execCommand("copy")
        } catch (err) {
          throw new Error("Fallback copy failed. " + err)
        }
        document.body.removeChild(textarea)
      }
      toast.success(t('clipboard.copySuccess'))
    } catch (err) {
      toast.error(t('clipboard.copyFail'))
      console.error("Copy failed:", err)
    }
  }

  const exportPasswords = () => {
    const data = {
      passwords: history,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `passwords-${new Date().toISOString().split("T")[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-slate-900">{t('app.title')}</h1>
          </div>
          <p className="text-slate-600 text-lg">{t('app.subtitle')}</p>
        </div>

        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="generator">{t('tabs.generator')}</TabsTrigger>
            <TabsTrigger value="history">{t('tabs.history')}</TabsTrigger>
            <TabsTrigger value="about">{t('tabs.about')}</TabsTrigger>
          </TabsList>

          <TabsContent value="generator" className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('generator.title')}
                </CardTitle>
                <CardDescription>{t('generator.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Generated Password Display */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">{t('generator.generatedPassword')}</Label>
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
                        <Label className="text-sm">{t('generator.strength')}</Label>
                        <Badge
                          variant="secondary"
                          className={`${getStrengthColor(passwordAnalysis.complexity.level)} text-white`}
                        >
                          {t(`generator.strengthLabels.${(passwordAnalysis.complexity.level).toLowerCase()}`)}
                        </Badge>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(passwordAnalysis.complexity.level)}`}
                          style={{ width: `${getStrengthWidth(passwordAnalysis.complexity.level)}%` }}
                        />
                      </div>
{/*                      {passwordAnalysis.complexity.feedback.length > 0 && (
                        <div className="text-sm text-slate-500 mt-3">
                          <p className="font-semibold mb-2"></p>
                          {passwordAnalysis.complexity.feedback.map((message, index) => (
                            <p key={index}>• {message}</p>
                          ))}
                        </div>
                      )} */}
                    </div>
                  )}
                </div>

                <Separator />

                {/* Controls */}
                <div className="space-y-6">
                  {/* Word Count Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">{t('generator.wordCount')}</Label>
                      <Badge variant="secondary">{t('generator.wordCountBadge', { count: options.wordCount })}</Badge>
                    </div>
                    <Slider
                      value={[options.wordCount]}
                      onValueChange={(value) => setOptions((prev) => ({ ...prev, wordCount: value[0] }))}
                      min={2}
                      max={6}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{t('generator.wordCountMin', { min: 2} )}</span>
                      <span>{t('generator.wordCountMax', { max: 6} )}</span>
                    </div>
                  </div>

                  {/* Main Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">{t('generator.capitalLetters')}</Label>
                        <p className="text-xs text-slate-500">{t('generator.capitalLettersDesc')}</p>
                      </div>
                      <Switch
                        checked={options.includeCapitals}
                        onCheckedChange={(checked) => handleOptionsChange({ includeCapitals: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">{t('generator.includeNumbers')}</Label>
                        <p className="text-xs text-slate-500">{t('generator.includeNumbersDesc')}</p>
                      </div>
                      <Switch
                        checked={options.includeNumbers}
                        onCheckedChange={(checked) => handleOptionsChange({ includeNumbers: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <Label className="text-sm font-medium">{t('generator.includeSpecials')}</Label>
                        <p className="text-xs text-slate-500">{t('generator.includeSpecialsDesc')}</p>
                      </div>
                      <Switch
                        checked={options.includeSpecials}
                        onCheckedChange={(checked) => handleOptionsChange({ includeSpecials: checked })}
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
                      {showAdvanced ? t('generator.hideAdvancedOptions') : t('generator.showAdvancedOptions')}
                    </Button>
                  </div>

                  {/* Advanced Options */}
                  {showAdvanced && (
                    <Card className="p-4 bg-slate-50">
                      <div className="space-y-4">
                        {/* Word Category */}
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">{t('generator.wordCategory')}</Label>
                          <Select
                            value={options.wordCategory}
                            onValueChange={(value: WordCategory) => handleOptionsChange({ wordCategory: value })}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mixed">{t('generator.wordCategoryOptions.mixed')}</SelectItem>
                              <SelectItem value="common">{t('generator.wordCategoryOptions.common')}</SelectItem>
                              <SelectItem value="nature">{t('generator.wordCategoryOptions.nature')}</SelectItem>
                              <SelectItem value="technology">{t('generator.wordCategoryOptions.technology')}</SelectItem>
                              <SelectItem value="abstract">{t('generator.wordCategoryOptions.abstract')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Word Length Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('generator.minWordLength')}</Label>
                            <Slider
                              value={[options.minWordLength]}
                              onValueChange={(value) => handleOptionsChange({ minWordLength: value[0] })}
                              min={4}
                              max={8}
                              step={1}
                            />
                            <div className="text-xs text-slate-500">{options.minWordLength} {t('generator.characters')}</div>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('generator.maxWordLength')}</Label>
                            <Slider
                              value={[options.maxWordLength]}
                              onValueChange={(value) => handleOptionsChange({ maxWordLength: value[0] })}
                              min={8}
                              max={15}
                              step={1}
                            />
                            <div className="text-xs text-slate-500">{options.maxWordLength} {t('generator.characters')}</div>
                          </div>
                        </div>

                        {/* Character Density */}
                        {(options.includeNumbers || options.includeSpecials) && (
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">{t('generator.charDensity')}</Label>
                            <Slider
                              value={[options.characterDensity * 100]}
                              onValueChange={(value) => handleOptionsChange({ characterDensity: value[0] / 100 })}
                              min={20}
                              max={100}
                              step={10}
                            />
                            <div className="text-xs text-slate-500">
                              {t('generator.charDensityDesc', { percent: Math.round(options.characterDensity * 100)} )}
                            </div>
                          </div>
                        )}

                        {/* Additional Options */}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <Label className="text-sm font-medium">{t('generator.avoidSimilarWords')}</Label>
                            <p className="text-xs text-slate-500">{t('generator.avoidSimilarWordsDesc')}</p>
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
                      {t('generator.generating')}
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5 mr-2" />
                      {t('generator.generate')}
                    </>
                  )}
                </Button>

                {/* Info */}
                <div className="text-center text-sm text-slate-500 space-y-1">
                  <p>{t('generator.localGeneration')}</p>
                  <p>{t('generator.usingWords', { count: WORD_CATEGORIES[defaultLocale][options.wordCategory].length })}</p>
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
                      {t('history.title')}
                    </CardTitle>
                    <CardDescription>{t('history.description')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={exportPasswords} disabled={history.length === 0}>
                      <Download className="h-4 w-4 mr-2" />
                      {t('history.export')}
                    </Button>
                    <Button variant="outline" onClick={clearHistory} disabled={history.length === 0}>
                      {t('history.clear')}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>{t('history.empty')}</p>
                    <p className="text-sm">{t('history.emptyDesc')}</p>
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
                              {entry.timestamp.toLocaleString()} • {t('generator.wordCountBadge', { count: entry.options.wordCount })}
                              {entry.options.includeCapitals && ` • ${t('generator.capitalLetters')}`}
                              {entry.options.includeNumbers && ` • ${t('generator.includeNumbers')}`}
                              {entry.options.includeSpecials && ` • ${t('generator.includeSpecials')}`}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (navigator.clipboard && window.isSecureContext) {
                                navigator.clipboard.writeText(entry.password)
                                toast.success(t('history.copy'))
                              } else {
                                const textarea = document.createElement("textarea")
                                textarea.value = entry.password
                                textarea.style.position = "fixed"
                                textarea.style.opacity = "0"
                                document.body.appendChild(textarea)
                                textarea.focus()
                                textarea.select()
                                try {
                                  document.execCommand("copy")
                                  toast.success(t('history.copy'))
                                } catch (err) {
                                  toast.error(t('history.copyError'))
                                  console.error("Copy failed:", err)
                                }
                                document.body.removeChild(textarea)
                              }
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
                  {t('about.title')}
                </CardTitle>
                <CardDescription>{t('about.description')}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">{t('about.securityInfo')}</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex justify-between">
                        <span>{t('about.passwordsGenerated')}</span>
                        <span className="font-mono">{history.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('about.availableWords')}</span>
                        <span className="font-mono">{WORD_CATEGORIES[defaultLocale][options.wordCategory].length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('about.wordRange')}</span>
                        <span className="font-mono">
                          {options.minWordLength}-{options.maxWordLength} {t('generator.wordCountBadge', { count: '' }).replace('{count} ', '')}
                        </span>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4">
                    <h3 className="font-semibold mb-3">{t('about.privacy')}</h3>
                    <div className="space-y-2 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{t('about.local')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{t('about.noData')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{t('about.cryptoSecure')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>{t('about.noDeps')}</span>
                      </div>
                    </div>
                  </Card>
                </div>

                <Separator />

                <div className="text-center space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('about.title')}</h3>
                    <p className="text-sm text-slate-600 max-w-md mx-auto">
                      {t('about.aboutText')}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold">{t('about.contact')}</h4>
                    <div className="flex justify-center gap-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Github className="h-4 w-4" />
                        <span>
                          <Link 
                            href="https://github.com/r4sheed" 
                            className="hover:underline underline-offset-2"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t('about.github')}
                          </Link>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-xs text-slate-500">
                      {t('app.version')} {t('app.builtWithNext')} & {t('app.builtWithShadcn')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
{/*           <Card className="text-center p-4">
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
          </Card> */}
        </div>
      </div>
    </div>
  )
}