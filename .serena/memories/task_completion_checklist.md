# Task Completion Checklist

When completing any development task in the TantanLay project, follow this checklist:

## Pre-Development
1. **Understand the requirements** - Clarify the exact functionality needed
2. **Check existing patterns** - Look at similar components/features for consistency
3. **Verify dependencies** - Ensure required packages are already installed

## During Development
1. **Follow TypeScript strict mode** - All code must pass type checking
2. **Use existing UI components** - Leverage components in `components/ui/`
3. **Maintain theme consistency** - Use `useColorScheme` for theming
4. **Handle errors gracefully** - Implement proper error handling and user feedback
5. **Follow database patterns** - Use transactions and proper data validation

## Code Quality Checks
1. **Run linting**: `npm run lint` - Must pass without errors
2. **TypeScript compilation**: Ensure no type errors in IDE
3. **Test functionality**: Use `npm start` to test in Expo Go or simulator

## Testing Workflow
1. **Start dev server**: `npm start`
2. **Test on target platform**: Android/iOS/Web as appropriate
3. **Verify database operations**: Check data persistence and integrity
4. **Test edge cases**: Empty states, error conditions, validation

## Final Steps
1. **Code review**: Ensure code follows project conventions
2. **Documentation**: Update comments or documentation if needed
3. **Git workflow**: Stage, commit with descriptive message
4. **No direct commits**: Only commit when explicitly requested by user

## Platform-Specific Notes (Windows)
- Use `dir` instead of `ls` for directory listing
- Use `type` instead of `cat` for file contents
- Git commands work the same as on Unix systems