# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e6]
      - heading "404" [level=1] [ref=e8]
      - heading "Page Not Found" [level=2] [ref=e9]
      - paragraph [ref=e10]: The page you're looking for doesn't exist or has been moved to a different location.
      - link "Go to Dashboard" [ref=e12] [cursor=pointer]:
        - /url: /dashboard
        - img [ref=e13]
        - text: Go to Dashboard
      - paragraph [ref=e16]: If you believe this is an error, please contact your system administrator
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e26]
```