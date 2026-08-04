# patient-chat-proxy

A tiny server for Emergency Code Alpha's patient chat feature.

It holds a real Anthropic API key privately (as an environment variable,
never written in any file here) and forwards chat requests from the game
to Anthropic. This exists because a browser-based game can never safely
hold a secret key itself -- anyone could view the file and find it.

There's exactly one file that matters: `api/chat.js`. Deploying this repo
to Vercel automatically turns that file into a live web address at
`https://<your-project-name>.vercel.app/api/chat` -- no other setup
needed beyond adding the `ANTHROPIC_API_KEY` environment variable in
Vercel's dashboard after deploying.
