https://github.com/user-attachments/assets/f857906e-1dc3-47c7-91e3-991c9306bc42

🧠 Mystry Thoughts

Mystry Thoughts is an anonymous social platform where users can share their personal thoughts and confessions without revealing their identity.
It features a unique anonymous match & chat system, connecting users for real-time conversations only after mutual interest and opposite-gender matching.

🚀 Tech Stack

Frontend: Next.js (TypeScript), Tailwind CSS, ShadCN UI

Backend: Node.js, Express.js, MongoDB (Mongoose)

Authentication: NextAuth.js

Real-time Communication: Socket.io

DevOps: GitHub Actions (CI/CD), Docker

💡 Key Features

🕵️ Anonymous Posting — Share thoughts and confessions without revealing identity

💬 Real-time Chat — Chat only after mutual and gender-based matching (Socket.io)

🧑‍🎨 Custom Avatar Builder — Personalize your anonymous profile (hair, skin tone, eyebrows & more)

🔒 Secure Authentication — NextAuth integration for user identity management

📱 Responsive Design — Fully optimized for mobile and desktop

⚙️ Automated Deployment — CI/CD pipeline using GitHub Actions and Docker

🧰 Installation & Setup

Clone the repository

git clone https://github.com/neernegi/mystry-thoughts.git
cd mystry-thoughts


Install dependencies

npm install


Set up environment variables
Create a .env.local file in the root directory and add:

MONGODB_URI=your_mongodb_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000


Run the development server

npm run dev


Run with Docker

docker build -t mystry-thoughts .
docker run -p 3000:3000 mystry-thoughts

🔄 CI/CD Pipeline

The project uses GitHub Actions for:

Automatic build & test on push

Docker image creation and deployment
