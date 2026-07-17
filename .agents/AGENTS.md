
## Core Operating Rules
- **Strict File Focus**: ONLY edit files directly related to the requested feature. NEVER touch, edit, or delete lines in other files.
- **Preservation Rule**: When updating a file, preserve 100% of its current structure, logic, and variables. Only append or selectively override functions that need upgrading. NEVER rewrite the whole file structure without explicit permission.
- **No Blank Screen**: Ensure UI changes maintain minimum contrast ratios. In Light Mode, prevent white-on-white or dark-on-dark. Always test visibility.
- **Crash Prevention**: All new logical blocks must be wrapped in 	ry {} catch (e) {} to gracefully handle errors without crashing the interface.
