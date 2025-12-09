# YomiTomo - Manga Reading Site

A clean, modern manga reading site with a beautiful Bento layout design. Built with Node.js, Express, and SQLite.

## Features

### User Features
- 📚 Browse manga collection in a clean Bento grid layout
- 📖 Read manga chapters with smooth page viewing
- 💬 Leave comments on chapters
- 🎨 Beautiful color scheme with #ffae42 accent color on dark background

### Admin Features
- ➕ Upload new manga with cover images
- ✏️ Edit manga details
- 🗑️ Delete manga
- 📑 Add chapters with multiple page images
- 📝 Edit chapter information
- 🔐 Secure admin authentication

## Installation

1. Clone the repository:
```bash
git clone https://github.com/cusnaruto/YomiTomo.git
cd YomiTomo
```

2. Install dependencies:
```bash
npm install
```

3. (Optional) Set environment variables for production:
```bash
export SESSION_SECRET=your-secure-random-secret-here
export PORT=3000
```

4. Start the server:
```bash
npm start
```

5. Open your browser and navigate to:
```
http://localhost:3000
```

## First Time Setup

1. Go to `http://localhost:3000/admin`
2. Click "Create Admin Account"
3. Enter a username and password
4. Login with your credentials
5. Start adding manga and chapters!

## Usage

### For Users
- Visit the homepage to see all available manga
- Click on any manga to view its details and chapters
- Click "Read" on any chapter to start reading
- Scroll through pages vertically
- Leave comments at the bottom of each chapter

### For Admins
1. Login at `/admin`
2. Click "Add New Manga" to create a manga entry
3. Fill in title, author, description, and optionally upload a cover image
4. Click "Add New Chapter" to add chapters to your manga
5. Select the manga, enter chapter number and title
6. Upload multiple page images in order
7. Manage existing manga with Edit/Delete buttons

## Project Structure

```
YomiTomo/
├── server.js           # Express server and API routes
├── database.js         # SQLite database configuration
├── package.json        # Dependencies and scripts
├── public/             # Frontend files
│   ├── index.html      # Homepage
│   ├── manga.html      # Manga detail page
│   ├── reader.html     # Chapter reader page
│   ├── admin.html      # Admin panel
│   └── styles.css      # Global styles
└── uploads/            # Uploaded images (auto-created)
```

## Technologies Used

- **Backend**: Node.js, Express
- **Database**: SQLite3
- **File Upload**: Multer
- **Authentication**: bcrypt, express-session
- **Frontend**: Vanilla HTML/CSS/JavaScript

## Color Scheme

- **Primary**: #ffae42 (Orange/Gold)
- **Background**: #1a1a1a (Dark)
- **Secondary Background**: #0f0f0f (Darker)
- **Text**: #f0f0f0 (Light)

## API Endpoints

### Public Endpoints
- `GET /api/manga` - Get all manga
- `GET /api/manga/:id` - Get manga with chapters
- `GET /api/chapter/:id` - Get chapter with pages and comments
- `POST /api/comment` - Post a comment

### Admin Endpoints (Authentication Required)
- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout
- `POST /api/admin/manga` - Create manga
- `PUT /api/admin/manga/:id` - Update manga
- `DELETE /api/admin/manga/:id` - Delete manga
- `POST /api/admin/chapter` - Create chapter
- `PUT /api/admin/chapter/:id` - Update chapter
- `DELETE /api/admin/chapter/:id` - Delete chapter

## Security Considerations

This is a basic implementation suitable for personal use or development. For production deployment, consider:

- **Rate Limiting**: Add rate limiting middleware (e.g., `express-rate-limit`) to prevent abuse
- **CSRF Protection**: Implement CSRF tokens for form submissions (e.g., `csurf`)
- **HTTPS**: Use HTTPS in production (set `NODE_ENV=production` for secure cookies)
- **Input Validation**: Add comprehensive input validation and sanitization
- **File Upload Limits**: Configure file size limits and file type validation
- **Database Security**: Use prepared statements (already implemented with SQLite3)
- **Session Secret**: Always use a strong, unique `SESSION_SECRET` environment variable in production

## License

MIT
