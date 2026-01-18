# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - heading "m." [level=1] [ref=e5]
        - paragraph [ref=e6]: Sign in to your account
        - paragraph [ref=e7]: Enter your credentials to access the moderation dashboard
      - generic [ref=e8]:
        - generic [ref=e9]:
          - generic [ref=e10]: Email
          - textbox "Email" [ref=e11]:
            - /placeholder: agent@example.com
        - generic [ref=e12]:
          - generic [ref=e13]: Password
          - textbox "Password" [ref=e14]:
            - /placeholder: ••••••••
        - button "Sign In" [active] [ref=e15] [cursor=pointer]
      - paragraph [ref=e16]: Demo Mode - Supabase not configured
  - button "Open Next.js Dev Tools" [ref=e22] [cursor=pointer]:
    - img [ref=e23]
  - alert [ref=e27]
```