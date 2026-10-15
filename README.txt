CYBERGUARD AI — MONGODB + VERCEL

Files:
public/ = frontend pages, CSS and browser JS
api/index.js = Express API and server-side admin authentication
package.json = dependencies
vercel.json = Vercel config
.env.example = environment variable template

MONGODB ATLAS
1. Create an Atlas cluster and database user.
2. Copy the Node.js driver connection string and replace the placeholders.
3. Add your Vercel deployment's connection access under Atlas Network Access. Do not expose the database unnecessarily.
4. The database 'cyberguard' and collection 'complaints' are created on first submission.

VERCEL DEPLOYMENT
1. Upload this project to a GitHub repository. Never commit .env or real credentials.
2. Import the repository in Vercel and deploy.
3. In Vercel Project Settings > Environment Variables add:
   MONGODB_URI = your Atlas connection string
   MONGODB_DB = cyberguard
   ADMIN_USERNAME = admin (or your chosen username)
   ADMIN_PASSWORD = your private chosen password
   SESSION_SECRET = a long random secret
   NODE_ENV = production
4. Redeploy after adding environment variables.
5. Open your Vercel URL. Admin login is at /login.html.

SECURITY / SCOPE NOTES
- The admin password is checked server-side and is not in frontend JS.
- Never commit your database URI, admin password or session secret.
- This is a college project prototype, not an official cybercrime reporting service.
- Complaint classification is keyword-based, not a trained ML model.
- Evidence image selection currently previews images in the browser only; it does not upload/store them.
- Do not collect passwords, bank PINs or unnecessary sensitive data in complaint text.


FRONTEND ADDITIONS:
- Evidence screenshot selector supports up to 3 images and previews them locally.
- In this version, screenshots are NOT uploaded or stored on the server; the form saves the complaint text only.
- Voice assistant uses browser speech recognition for speech-to-text and speech synthesis for read-aloud instructions. Browser support and microphone permission are required.
