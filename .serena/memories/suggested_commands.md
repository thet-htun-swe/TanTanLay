# Suggested Development Commands

## Development Server
- `npm start` or `npx expo start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator  
- `npm run web` - Run in web browser

## Code Quality
- `npm run lint` - Run ESLint to check code quality and style

## Project Management
- `npm run reset-project` - Reset the project (runs custom script)

## Windows System Commands
Since this is a Windows development environment:
- `dir` - List directory contents (equivalent to `ls` on Unix)
- `cd` - Change directory
- `type` - Display file contents (equivalent to `cat` on Unix)
- `findstr` - Search text in files (equivalent to `grep` on Unix)
- `git` - Git version control commands work the same

## Task Completion Workflow
When completing any development task:
1. Run `npm run lint` to ensure code style compliance
2. Test the app using `npm start` and verify functionality
3. Check git status and commit changes if appropriate