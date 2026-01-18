# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - img [ref=e7]
          - heading "m." [level=1] [ref=e9]
          - paragraph [ref=e10]: Sign in to your account
        - generic [ref=e11]:
          - generic [ref=e12]:
            - generic [ref=e13]: Email
            - textbox "Email" [ref=e14]:
              - /placeholder: agent@example.com
          - generic [ref=e15]:
            - generic [ref=e16]: Password
            - textbox "Password" [ref=e17]:
              - /placeholder: ••••••••
          - button "Sign In" [ref=e18] [cursor=pointer]:
            - img [ref=e19]
            - text: Sign In
          - paragraph [ref=e23]: "Demo mode: Use any email/password combination"
        - generic [ref=e27]: Demo Mode Active
        - generic [ref=e28]:
          - paragraph [ref=e29]: Supabase not configured - using demo authentication
          - paragraph [ref=e30]: Enterprise-grade security
      - paragraph [ref=e31]: Your data is encrypted and secure
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
    - img [ref=e38]
  - alert [ref=e41]
```