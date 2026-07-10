<div align="center">
<h1>
    <img src="public/banner.png" alt="WindKeep" width="100%"/>
</h1>

[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![Vulnerabilities](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=vulnerabilities)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![Lines of Code](https://sonarcloud.io/api/project_badges/measure?project=matimortari_windkeep&metric=ncloc)](https://sonarcloud.io/summary/new_code?id=matimortari_windkeep)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat&colorA=0d1117)](https://opensource.org/licenses/MIT)

[**WindKeep**](https://windkeep.up.railway.app) is a secrets management platform that helps teams and developers to securely store, manage, and share sensitive information. It features role-based access control, audit routines, encrypted secret storage, and an integrated [**Command-Line Interface**](./cli/README.md).

</div>

## Features

- **Authentication:** OAuth sign-in via Google, GitHub, or GitLab.
- **Role-Based Access Control:** Control user access to resources at both organization and project levels.
- **Secret Management:** Create, edit, and delete secrets within projects. Secrets are scoped to a specific environment and encrypted at rest using AES-256-GCM.
- **Audit Trail:** Sensitive operations are logged and can be inspected to ensure transparency and accountability. Each secret keeps its own history of changes.
- **Service Tokens:** Generate service tokens for programmatic access to secrets, with environment and expiration date control.
- **Command-Line Interface:** Interact with the platform directly from the terminal. Provides commands for organization and project management, pull/push operations, and automatic secret injection into local development and CI/CD pipelines.

## Stack

- **Nuxt.js** with **Vue** composition API and **Nitro** server engine.
- **OAuth** authentication with Google, GitHub, or GitLab.
- **Prisma** for **PostgreSQL** database management.
- **Redis** for caching and rate limiting.
- **Pinia** for state management.
- **Zod** for schema validation.
- **TypeScript**.
- **ESLint**.
- **Tailwind CSS**.
- **Go** for CLI development using **Cobra**.

## Contact

Feel free to reach out to discuss collaboration opportunities or to say hello!

- [**My Email**](mailto:matheus.felipe.19rt@gmail.com)
- [**My LinkedIn Profile**](https://www.linkedin.com/in/matheus-mortari-19rt)
- [**My GitHub Profile**](https://github.com/matimortari)

## License

This project is licensed under the [**MIT License**](./LICENSE).
