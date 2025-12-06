"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'ne'

interface Translations {
  [key: string]: string
}

interface I18nContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, params?: Record<string, string>) => string
}

const translations: Record<Language, Translations> = {
  en: {
    // Navigation
    'nav.browse': 'Browse',
    'nav.reportItem': 'Report Item',
    'nav.organizations': 'Organizations',
    'nav.signIn': 'Sign In',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Logout',

    // Hero
    'hero.title': 'Lost something?',
    'hero.subtitle': 'Found something?',
    'hero.description': "Nepal's trusted platform to reunite people with their belongings. From Kathmandu to Pokhara, we connect finders with seekers.",
    'hero.startFinding': 'Start finding',
    'hero.addOrganization': 'Add to your organisation',
    'hero.howItWorks': 'How it works',

    // How it works
    'howItWorks.title': 'How It Works',
    'howItWorks.subtitle': 'Reunite with your belongings in four simple steps',
    'howItWorks.step1.title': 'Post or Search',
    'howItWorks.step1.description': 'Report your lost item or browse found items in your area across Nepal.',
    'howItWorks.step2.title': 'Get Matched',
    'howItWorks.step2.description': 'Our smart system matches lost items with found reports and notifies you instantly.',
    'howItWorks.step3.title': 'Verify Identity',
    'howItWorks.step3.description': 'Secure verification process ensures items go to their rightful owners.',
    'howItWorks.step4.title': 'Safe Handover',
    'howItWorks.step4.description': 'Meet safely at verified locations or arrange secure delivery across Nepal.',

    // Verification
    'verification.title': 'Trusted Verification',
    'verification.subtitle': 'We ensure every transaction is safe and items reach their rightful owners',
    'verification.id.title': 'ID Verification',
    'verification.id.description': 'Verify your identity using citizenship, passport, or driving license.',
    'verification.payment.title': 'Payment Verification',
    'verification.payment.description': 'Small verification fee via eSewa, Khalti, or IME Pay ensures genuine users.',
    'verification.badge.title': 'Verified Badge',
    'verification.badge.description': 'Verified users get priority in search results and build trust.',

    // Delivery
    'delivery.title': 'Safe Handover & Delivery',
    'delivery.subtitle': 'Multiple options to ensure your items are returned safely',
    'delivery.meetup.title': 'Safe Meet-up Points',
    'delivery.meetup.description': 'Meet at verified public locations like police stations, malls, or busy public areas.',
    'delivery.delivery.title': 'Secure Delivery',
    'delivery.delivery.description': 'Arrange delivery through trusted couriers across Nepal with tracking.',
    'delivery.confirm.title': 'Handover Confirmation',
    'delivery.confirm.description': 'Both parties confirm successful handover with OTP verification.',

    // Organizations
    'organizations.title': 'Manage lost & found for your organization',
    'organizations.subtitle': 'For Organizations',
    'organizations.description': "Join Nepal's largest network of trusted organizations. Help reunite people with their belongings while maintaining your reputation for excellent service.",
    'organizations.feature1': 'Bulk upload found items with one click',
    'organizations.feature2': 'Track storage locations and retention dates',
    'organizations.feature3': 'Analytics dashboard for your team',
    'organizations.feature4': 'Verified organization badge',

    // Browse
    'browse.title': 'Browse Items',
    'browse.subtitle': 'Search through lost and found items across Nepal',
    'browse.allItems': 'All Items',
    'browse.lostItems': 'Lost Items',
    'browse.foundItems': 'Found Items',
    'browse.filters': 'Filters',
    'browse.noResults': 'No items found',
    'browse.searching': 'Searching...',

    // Item form
    'form.reportLost': 'Report Lost Item',
    'form.reportFound': 'Report Found Item',
    'form.title': 'Title',
    'form.description': 'Description',
    'form.category': 'Category',
    'form.location': 'Location',
    'form.date': 'Date',
    'form.time': 'Time',
    'form.reward': 'Reward (NPR)',
    'form.contact': 'Contact',
    'form.photos': 'Photos',
    'form.submit': 'Submit',

    // Claims
    'claims.title': 'This is mine',
    'claims.secretInfo': 'Describe unique identifying features',
    'claims.proof': 'Upload proof of ownership',
    'claims.submit': 'Submit Claim',
    'claims.pending': 'Claim Pending',
    'claims.approved': 'Claim Approved',
    'claims.rejected': 'Claim Rejected',

    // Common
    'common.lost': 'Lost',
    'common.found': 'Found',
    'common.verified': 'Verified',
    'common.loading': 'Loading...',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.share': 'Share',

    // Footer
    'footer.tagline': "Nepal's trusted platform for reuniting people with their lost belongings. Connect, verify, and recover.",
    'footer.platform': 'Platform',
    'footer.support': 'Support',
    'footer.legal': 'Legal',
    'footer.copyright': '© 2025 Balchhi. All rights reserved.',
    'footer.madeIn': 'Made with ❤️ in Nepal • नेपालमा बनेको',
  },
  ne: {
    // Navigation
    'nav.browse': 'खोज्नुहोस्',
    'nav.reportItem': 'वस्तु रिपोर्ट',
    'nav.organizations': 'संस्थाहरू',
    'nav.signIn': 'साइन इन',
    'nav.dashboard': 'ड्यासबोर्ड',
    'nav.logout': 'लग आउट',

    // Hero
    'hero.title': 'केहि हराउनुभयो?',
    'hero.subtitle': 'केहि भेट्टाउनुभयो?',
    'hero.description': 'मान्छेहरूलाई तिनीहरूको सामानसँग पुनर्मिलन गर्ने नेपालको भरपर्दो प्लेटफर्म। काठमाडौंदेखि पोखरासम्म, हामी खोज्नेहरूलाई भेट्टाउनेहरूसँग जोड्छौं।',
    'hero.startFinding': 'खोज्न सुरु गर्नुहोस्',
    'hero.addOrganization': 'तपाईंको संस्था थप्नुहोस्',
    'hero.howItWorks': 'यो कसरी काम गर्छ',

    // How it works
    'howItWorks.title': 'यो कसरी काम गर्छ',
    'howItWorks.subtitle': 'चार सरल चरणहरूमा आफ्नो सामानसँग पुनर्मिलन गर्नुहोस्',
    'howItWorks.step1.title': 'पोस्ट वा खोज्नुहोस्',
    'howItWorks.step1.description': 'आफ्नो हराएको वस्तु रिपोर्ट गर्नुहोस् वा नेपालभर तपाईंको क्षेत्रमा भेटिएका वस्तुहरू हेर्नुहोस्।',
    'howItWorks.step2.title': 'मिलान पाउनुहोस्',
    'howItWorks.step2.description': 'हाम्रो स्मार्ट प्रणालीले हराएका वस्तुहरूलाई भेटिएका रिपोर्टहरूसँग मिलान गर्छ र तपाईंलाई तुरुन्तै सूचित गर्छ।',
    'howItWorks.step3.title': 'पहिचान प्रमाणित गर्नुहोस्',
    'howItWorks.step3.description': 'सुरक्षित प्रमाणीकरण प्रक्रियाले वस्तुहरू तिनीहरूको सही मालिकहरूलाई पुग्छ भनी सुनिश्चित गर्छ।',
    'howItWorks.step4.title': 'सुरक्षित हस्तान्तरण',
    'howItWorks.step4.description': 'प्रमाणित स्थानहरूमा सुरक्षित रूपमा भेट्नुहोस् वा नेपालभर सुरक्षित डेलिभरी व्यवस्था गर्नुहोस्।',

    // Verification
    'verification.title': 'विश्वसनीय प्रमाणीकरण',
    'verification.subtitle': 'हामी प्रत्येक लेनदेन सुरक्षित छ र वस्तुहरू तिनीहरूको सही मालिकहरूलाई पुग्छ भनी सुनिश्चित गर्छौं',
    'verification.id.title': 'परिचयपत्र प्रमाणीकरण',
    'verification.id.description': 'नागरिकता, राहदानी, वा ड्राइभिङ लाइसेन्स प्रयोग गरेर आफ्नो पहिचान प्रमाणित गर्नुहोस्।',
    'verification.payment.title': 'भुक्तानी प्रमाणीकरण',
    'verification.payment.description': 'eSewa, Khalti, वा IME Pay मार्फत सानो प्रमाणीकरण शुल्कले वास्तविक प्रयोगकर्ताहरू सुनिश्चित गर्छ।',
    'verification.badge.title': 'प्रमाणित ब्याज',
    'verification.badge.description': 'प्रमाणित प्रयोगकर्ताहरूलाई खोज परिणामहरूमा प्राथमिकता मिल्छ र विश्वास निर्माण हुन्छ।',

    // Delivery
    'delivery.title': 'सुरक्षित हस्तान्तरण र डेलिभरी',
    'delivery.subtitle': 'तपाईंको वस्तुहरू सुरक्षित रूपमा फिर्ता भएको सुनिश्चित गर्न धेरै विकल्पहरू',
    'delivery.meetup.title': 'सुरक्षित भेट्ने स्थानहरू',
    'delivery.meetup.description': 'प्रहरी चौकी, मल, वा व्यस्त सार्वजनिक क्षेत्रहरू जस्ता प्रमाणित सार्वजनिक स्थानहरूमा भेट्नुहोस्।',
    'delivery.delivery.title': 'सुरक्षित डेलिभरी',
    'delivery.delivery.description': 'ट्र्याकिङसहित नेपालभर भरपर्दो कुरियरहरू मार्फत डेलिभरी व्यवस्था गर्नुहोस्।',
    'delivery.confirm.title': 'हस्तान्तरण पुष्टि',
    'delivery.confirm.description': 'दुवै पक्षले OTP प्रमाणीकरणसँग सफल हस्तान्तरण पुष्टि गर्छन्।',

    // Organizations
    'organizations.title': 'तपाईंको संस्थाको लागि हराएको र भेटिएको व्यवस्थापन गर्नुहोस्',
    'organizations.subtitle': 'संस्थाहरूको लागि',
    'organizations.description': 'नेपालको सबैभन्दा ठूलो भरपर्दो संस्थाहरूको नेटवर्कमा सामेल हुनुहोस्। उत्कृष्ट सेवाको लागि आफ्नो प्रतिष्ठा कायम राख्दै मान्छेहरूलाई तिनीहरूको सामानसँग पुनर्मिलन गर्न मद्दत गर्नुहोस्।',
    'organizations.feature1': 'एक क्लिकमा भेटिएका वस्तुहरू थोक अपलोड',
    'organizations.feature2': 'भण्डारण स्थानहरू र राखिने मितिहरू ट्र्याक गर्नुहोस्',
    'organizations.feature3': 'तपाईंको टोलीको लागि एनालिटिक्स ड्यासबोर्ड',
    'organizations.feature4': 'प्रमाणित संस्था ब्याज',

    // Browse
    'browse.title': 'वस्तुहरू खोज्नुहोस्',
    'browse.subtitle': 'नेपालभरका हराएका र भेटिएका वस्तुहरू खोज्नुहोस्',
    'browse.allItems': 'सबै वस्तुहरू',
    'browse.lostItems': 'हराएका वस्तुहरू',
    'browse.foundItems': 'भेटिएका वस्तुहरू',
    'browse.filters': 'फिल्टरहरू',
    'browse.noResults': 'कुनै वस्तु भेटिएन',
    'browse.searching': 'खोजिदै...',

    // Item form
    'form.reportLost': 'हराएको वस्तु रिपोर्ट गर्नुहोस्',
    'form.reportFound': 'भेटिएको वस्तु रिपोर्ट गर्नुहोस्',
    'form.title': 'शीर्षक',
    'form.description': 'विवरण',
    'form.category': 'वर्ग',
    'form.location': 'स्थान',
    'form.date': 'मिति',
    'form.time': 'समय',
    'form.reward': 'इनाम (रु.)',
    'form.contact': 'सम्पर्क',
    'form.photos': 'फोटोहरू',
    'form.submit': 'पेश गर्नुहोस्',

    // Claims
    'claims.title': 'यो मेरो हो',
    'claims.secretInfo': 'अद्वितीय पहिचान विशेषताहरू वर्णन गर्नुहोस्',
    'claims.proof': 'स्वामित्वको प्रमाण अपलोड गर्नुहोस्',
    'claims.submit': 'दाबी पेश गर्नुहोस्',
    'claims.pending': 'दाबी विचाराधीन',
    'claims.approved': 'दाबी स्वीकृत',
    'claims.rejected': 'दाबी अस्वीकृत',

    // Common
    'common.lost': 'हराएको',
    'common.found': 'भेटिएको',
    'common.verified': 'प्रमाणित',
    'common.loading': 'लोड हुँदैछ...',
    'common.error': 'त्रुटि भयो',
    'common.success': 'सफल',
    'common.cancel': 'रद्द गर्नुहोस्',
    'common.save': 'सुरक्षित गर्नुहोस्',
    'common.delete': 'मेट्नुहोस्',
    'common.edit': 'सम्पादन गर्नुहोस्',
    'common.view': 'हेर्नुहोस्',
    'common.search': 'खोज्नुहोस्',
    'common.filter': 'फिल्टर गर्नुहोस्',
    'common.sort': 'क्रमबद्ध गर्नुहोस्',
    'common.share': 'साझा गर्नुहोस्',

    // Footer
    'footer.tagline': 'मान्छेहरूलाई तिनीहरूको हराएको सामानसँग पुनर्मिलन गर्ने नेपालको भरपर्दो प्लेटफर्म। जोड्नुहोस्, प्रमाणित गर्नुहोस्, र पुनर्प्राप्त गर्नुहोस्।',
    'footer.platform': 'प्लेटफर्म',
    'footer.support': 'सहयोग',
    'footer.legal': 'कानुनी',
    'footer.copyright': '© २०२५ खोजपायो। सर्वाधिकार सुरक्षित।',
    'footer.madeIn': 'नेपालमा ❤️ सँग बनेको',
  },
}

const I18nContext = createContext<I18nContextType | undefined>(undefined)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')

  useEffect(() => {
    const stored = localStorage.getItem('khojpayo-language') as Language
    if (stored && (stored === 'en' || stored === 'ne')) {
      setLanguageState(stored)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('khojpayo-language', lang)
  }

  const t = (key: string, params?: Record<string, string>): string => {
    let text = translations[language][key] || translations['en'][key] || key
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, value)
      })
    }
    
    return text
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

// Language switcher component
export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n()

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ne' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#2B2B2B] text-[#FFFFFF] text-sm font-medium hover:bg-[#2B2B2B] transition-colors"
    >
      {language === 'en' ? 'नेपाली' : 'English'}
    </button>
  )
}

