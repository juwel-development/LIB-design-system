---
status: accepted
---

# Floating layers share one elevation role

The library exposes `--elevation-floating`, defaulting to Tailwind's `shadow-lg`, for every Floating
Layer it paints. Dialog is the first reader; popup menus and drawers may share it because each sits
temporarily above existing content, while standing structure such as Sidebar does not read it even
when sticky. A component-specific Dialog token was rejected because elevation describes the shared
depth relationship rather than the component, and an elevation scale was rejected because it would
leave components choosing unexplained rungs.
