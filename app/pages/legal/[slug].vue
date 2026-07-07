<template>
  <h1>
    {{ LEGAL_PAGES[slug]?.title }}
  </h1>

  <div v-for="(section, index) in LEGAL_PAGES[slug]?.content" :key="index">
    <h2 :id="slugify(section.title)">
      {{ section.title }}
    </h2>

    <p v-for="(para, pIdx) in section.paragraphs" :key="pIdx" v-html="para" />

    <ul v-if="section.list">
      <li v-for="(item, lIdx) in section.list" :key="lIdx" v-html="item" />
    </ul>
  </div>
</template>

<script setup lang="ts">
const { public: { baseURL } } = useRuntimeConfig()
const route = useRoute()
const slug = route.params.slug as string

const PRIVACY_POLICY: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Introduction",
    paragraphs: [
      "This Privacy Policy explains how WindKeep collects, uses, and protects your personal information when you access or use our services, including web applications and command-line tools.",
      "In this Policy, “we”, “us”, and “our” refer to WindKeep and its affiliates, and “you” and “your” refer to users of our services.",
    ],
  },
  {
    title: "Information We Collect",
    paragraphs: ["We collect information to provide, secure, and improve our services, including:"],
    list: [
      "Account information from OAuth providers (Google, GitHub, GitLab).",
      "Secrets and configuration data you create, store, or share within projects.",
      "Usage analytics such as feature interactions, page visits, and CLI commands.",
      "Technical data including device type, browser, IP address, and cookies.",
    ],
  },
  {
    title: "How We Use Your Information",
    paragraphs: ["We use the information we collect to:"],
    list: [
      "Provide, maintain, and enhance the service.",
      "Authenticate users and enforce access controls.",
      "Analyze usage patterns and generate analytics for projects and organizations.",
      "Communicate important updates, including security alerts and policy changes.",
      "Ensure compliance with legal obligations and protect platform integrity.",
    ],
  },
  {
    title: "Sharing and Disclosure",
    paragraphs: ["We do not sell your personal information. We may share data under the following circumstances:"],
    list: [
      "With service providers that help us operate or secure the platform.",
      "When required by law, legal process, or governmental request.",
      "To protect the rights, safety, or property of WindKeep, its users, or third parties.",
      "During mergers, acquisitions, or other corporate transactions, while keeping user data secure.",
    ],
  },
  {
    title: "Cookies and Tracking",
    paragraphs: ["WindKeep uses cookies and similar technologies to enhance security, improve your experience, and measure usage."],
    list: [
      "Essential cookies for authentication and security.",
      "Analytics cookies to monitor platform usage and feature adoption.",
      "Optional cookies for personalizing preferences and improving service.",
    ],
  },
  {
    title: "Data Retention and Security",
    paragraphs: [
      "We retain personal and organizational data only as long as necessary to provide our services or comply with legal obligations. Secrets are encrypted at rest, and we implement strong technical and organizational measures to protect data from unauthorized access, disclosure, or misuse.",
    ],
  },
  {
    title: "Your Rights",
    paragraphs: ["Depending on your jurisdiction, you may have rights regarding your personal data, including:"],
    list: [
      "Accessing or correcting your personal information.",
      "Requesting deletion of your personal information or organizational data you control.",
      "Objecting to or restricting certain processing activities.",
      "Withdrawing consent where applicable.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. Continued use of WindKeep constitutes acceptance of the updated policy. We encourage you to review this page periodically.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "If you have any questions about the Privacy Policy, email the maintainer at <a href='mailto:matheus.felipe.19rt@gmail.com'>matheus.felipe.19rt@gmail.com</a>.",
    ],
  },
]

const TERMS_OF_SERVICE: { title: string, paragraphs: string[], list?: string[] }[] = [
  {
    title: "Introduction",
    paragraphs: [
      "Welcome to WindKeep! By accessing or using our service, you agree to comply with and be bound by these Terms of Service. If you do not agree, please do not use WindKeep.",
      "In these Terms, “we”, “us”, and “our” refer to WindKeep and its affiliates, and “you” and “your” refer to users of our service. These Terms govern your access to and use of WindKeep, including all features, websites, and applications.",
    ],
  },
  {
    title: "Use of Service & Data",
    paragraphs: [
      "WindKeep helps users and organizations securely manage, store, and share environment variables and secrets. You agree not to misuse the service or engage in prohibited activities. You retain ownership of any secrets or data you create or upload, while granting WindKeep a limited license to host, store, and transmit such data solely for service purposes. WindKeep collects usage analytics and authentication data to operate the platform; see our Privacy Policy for details.",
    ],
    list: [
      "Do not upload or store illegal, harmful, or malicious content.",
      "Do not attempt to access secrets or projects you are not authorized to view.",
      "Do not use WindKeep for phishing, spamming, or distributing malware.",
      "Follow organization roles and access controls; do not bypass permissions.",
    ],
  },
  {
    title: "Disclaimers & Termination",
    paragraphs: [
      "WindKeep is provided on an \"as-is\" basis. We do not guarantee uninterrupted access, error-free performance, or the absolute security of your data. We may suspend or terminate your account if you violate these Terms, misuse the service, or engage in harmful activity. You may also delete your account at any time.",
      "Accounts may be suspended or terminated in cases including, but not limited to:",
    ],
    list: [
      "Violating these Terms or applicable laws.",
      "Uploading content that is illegal, harmful, or infringes third-party rights.",
      "Attempting to hack, exploit, or disrupt the platform or other users' projects.",
      "Bypassing or abusing role-based access controls.",
      "Spamming or sending unsolicited communications through WindKeep.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These Terms are governed by the laws of the jurisdiction where WindKeep operates. Any disputes will be resolved in the competent courts of that jurisdiction.",
    ],
  },
  {
    title: "Changes to Terms",
    paragraphs: [
      "We may update these Terms from time to time. Continued use of WindKeep constitutes acceptance of the updated Terms. We encourage you to review the Terms periodically.",
    ],
  },
  {
    title: "Contact",
    paragraphs: [
      "If you have any questions about the Terms of Service, email the maintainer at <a href='mailto:matheus.felipe.19rt@gmail.com'>matheus.felipe.19rt@gmail.com</a>.",
    ],
  },
]

const LEGAL_PAGES: Record<string, { title: string, description: string, content: { title: string, paragraphs: string[], list?: string[] }[] }> = {
  privacy: { title: "Privacy Policy", description: "Read the privacy policy for WindKeep.", content: PRIVACY_POLICY },
  terms: { title: "Terms of Service", description: "Read the terms of service for WindKeep.", content: TERMS_OF_SERVICE },
}

useHead({
  title: LEGAL_PAGES[slug]?.title,
  link: [{ rel: "canonical", href: `${baseURL}/legal/${slug}` }],
  meta: [{ name: "description", content: LEGAL_PAGES[slug]?.description }],
})

definePageMeta({ layout: "content" })
</script>
