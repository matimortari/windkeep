<div align="center">
<h1>
    <img src="public/logo-full-light.png" alt="Logo" width="300" />
</h1>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat&colorA=0d1117)](https://opensource.org/licenses/MIT)

[**windkeep**](https://windkeep.vercel.app) is a secrets management platform that helps organizations securely store, manage, and share sensitive information. It features role-based access control, audit logging, encrypted storage, and an integrated command line interface for easy secret management.

Also check out the [**CLI documentation**](./cli/README.md) for usage and setup instructions.

</div>

## Features

- **User Authentication:** Sign in using your Google, GitHub, or GitLab account.
- **Multi-Tenant Architecture:** Each organization operates within its own environment, with dedicated members and projects, providing full access control.
- **Role-Based Access Control:** Control access at both organization and project levels for maximum flexibility and security.
- **Audit Logs:** Monitor your organization's activities with detailed audit logs tracking sensitive operations, such as secret changes and role updates.
- **Encrypted Secrets:** Your secrets are encrypted at rest and never exposed unencrypted beyond the UI.
- **CLI Integration:** Take control from your terminal with the WindKeep CLI for fast, scriptable management.

## Stack

- **Nuxt.js** with **Vue** composition API and **Nitro** server engine.
- **OAuth** authentication with Google, GitHub, or GitLab.
- **Prisma** for **PostgreSQL** database management.
- **Pinia** for state management.
- **Zod** for schema validation.
- **TypeScript**.
- **ESLint**.
- **Tailwind CSS**.
- **Framer Motion**.
- **Go** for CLI development using **Cobra**.
- **Vercel** for deployment, blob storage and website analytics.

## Contact

Feel free to reach out to discuss collaboration opportunities or to say hello!

- [**My Email**](mailto:matheus.felipe.19rt@gmail.com)
- [**My LinkedIn Profile**](https://www.linkedin.com/in/matheus-mortari-19rt)
- [**My GitHub Profile**](https://github.com/matimortari)

## License

This project is licensed under the [**MIT License**](./LICENSE).
