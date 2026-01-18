# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - img [ref=e6]
      - heading "Something went wrong" [level=1] [ref=e8]
      - paragraph [ref=e9]: An unexpected error occurred. Don't worry, your work is safe. You can try refreshing the page or go back to the dashboard.
      - paragraph [ref=e11]: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set in environment variables
      - generic [ref=e12]:
        - button "Try Again" [ref=e13] [cursor=pointer]:
          - img [ref=e14]
          - text: Try Again
        - link "Dashboard" [ref=e19] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e20]
          - text: Dashboard
      - paragraph [ref=e23]: If this problem persists, please contact your system administrator with the error details above
  - region "Notifications (F8)":
    - list
  - generic [ref=e28] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e29]:
      - img [ref=e30]
    - generic [ref=e33]:
      - button "Open issues overlay" [ref=e34]:
        - generic [ref=e35]:
          - generic [ref=e36]: "0"
          - generic [ref=e37]: "1"
        - generic [ref=e38]: Issue
      - button "Collapse issues badge" [ref=e39]:
        - img [ref=e40]
  - alert [ref=e42]
```