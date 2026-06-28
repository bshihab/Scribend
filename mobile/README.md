# Scribend

Scribend is an offline-first medical scribe designed for healthcare workers in remote areas with zero Wi-Fi. It captures doctor-patient audio, converts it to text, retrieves historical patient context, and structures the encounter into a SOAP note.

Scribend frontend is built with React Native + TypeScript. AI inference is currently mocked through a TypeScript bridge and can later be connected to the native ExecuTorch runtime through a React Native Native Module.

Current frontend constraints:
- React Native CLI / bare Android app
- TypeScript UI only
- No Firebase, backend server, analytics SDK, auth, cloud APIs, or remote model calls
- Synthetic demo patients only
- Mock AI bridge in `src/services/MockScribendAIBridge.ts`

Useful commands:

```bash
npm install
npm run typecheck
npm test
npm run start
npm run android
```
