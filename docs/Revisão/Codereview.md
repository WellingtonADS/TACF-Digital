@path src/pages/AccessProfilesManagement.tsx 

The loadAllData function is referenced in the dependency array implicitly but not declared as a dependency. While this works because loadAllData is defined in the component scope, it violates the exhaustive-deps rule. Consider wrapping loadAllData in useCallback or adding it to the dependency array to follow React best practices and prevent potential stale closure issues.

The loadProfilePermissions function is not included in the dependency array. Wrap loadProfilePermissions in useCallback or add it to the dependencies to comply with React's exhaustive-deps rule and avoid potential bugs from stale closures.

Similar to the mobile view, all four table columns render checkboxes with the same enabled state and togglePermission call using perm.id. This prevents independent configuration of view/create/edit/delete permissions. The desktop table has the same logical error as the mobile view where all permission types are treated as a single toggle.
