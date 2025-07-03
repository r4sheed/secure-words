# SecureWords Pro

SecureWords Pro is a professional password generator that creates memorable yet secure passwords using real dictionary words. It balances security and usability, generating cryptographically secure passwords locally in your browser.

## Features

- **Memorable passwords**: Uses real words for easy recall
- **Customizable**: Adjust word count, word length, categories, and more
- **Security-focused**: Cryptographically secure random generation
- **No data transmission**: Passwords are generated and stored locally
- **Password history**: View and export your generated passwords
- **Password strength analysis**: Visual feedback on password complexity

## Getting Started

First, install dependencies and run the development server:

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Use the **Generator** tab to create a new password.
- Adjust options such as word count, capitalization, numbers, and advanced filters.
- Copy the generated password or export your password history as a JSON file.
- All passwords are generated and stored locally; nothing is sent to any server.

## Customization

- **Word Count**: Choose 2–4 words per password
- **Word Category**: Select from mixed, common, nature, technology, or abstract
- **Word Length**: Set minimum and maximum word length
- **Numbers**: Control number density within words
- **Avoid Similar Words**: Prevent phonetically similar words for better security

## Technologies Used

- [Next.js](https://nextjs.org/)
- [shadcn/ui](https://ui.shadcn.com/)
- TypeScript, React

## License

MIT

---

Built by [r4sheed](https://github.com/r4sheed).
