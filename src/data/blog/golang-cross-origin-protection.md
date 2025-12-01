---
title: "CSRF Protection in Go 1.25: The New CrossOriginProtection API"
author: Samuel Adebayo
pubDatetime: 2025-10-15T10:00:00.000+01:00
modDatetime: 2025-10-15T10:00:00.000+01:00
slug: golang-cross-origin-protection
featured: false
draft: false
tags:
  - golang
  - security
description: "A comprehensive guide to Go 1.25's new CrossOriginProtection API - a modern, token-free approach to CSRF protection that leverages browser headers for security"
---

> Go 1.25 introduces a game-changing approach to CSRF protection that eliminates the need for tokens and cookies. Here's everything you need to know about `CrossOriginProtection` and why it's a significant improvement over traditional methods.

## Table of Contents

## The CSRF Problem: A Quick Refresher

Cross-Site Request Forgery (CSRF) is a security vulnerability that tricks authenticated users into executing unwanted actions on a web application. Imagine this scenario:

You're logged into your bank's website, and then you visit a malicious site that contains this hidden form:

```html
<form action="https://yourbank.com/transfer" method="post">
  <input type="hidden" name="amount" value="10000" />
  <input type="hidden" name="recipient" value="attacker-account" />
  <input type="submit" value="Click here for a free iPhone!" />
</form>
```

When you click that innocent-looking button, the form submits to your bank with your authenticated session cookies, potentially transferring money without your knowledge. That's CSRF in action.

## Traditional CSRF Protection: The Token Approach

Historically, developers have relied on CSRF tokens to prevent these attacks. Here's how it typically worked:

```go
// OLD WAY: Using gorilla/csrf
import "github.com/gorilla/csrf"

func main() {
    // Generate and manage secret keys
    CSRF := csrf.Protect(
        []byte("32-byte-long-auth-key"),
        csrf.Secure(false), // Set to true in production
    )

    mux := http.NewServeMux()
    mux.HandleFunc("/form", func(w http.ResponseWriter, r *http.Request) {
        // Must inject token into EVERY form
        data := map[string]interface{}{
            csrf.TemplateTag: csrf.TemplateField(r),
            "otherData": "your actual content",
        }
        tmpl.Execute(w, data)
    })

    http.ListenAndServe(":8080", CSRF(mux))
}
```

And in your HTML template:

```html
<form method="POST" action="/submit">
  {{ .csrfField }}
  <!-- This generates a hidden input with the token -->
  <input type="text" name="username" />
  <button type="submit">Submit</button>
</form>
```

### The Problems with Token-Based CSRF

While effective, this approach had several pain points:

1. **Developer Burden**: You had to remember to add CSRF tokens to every form
2. **State Management**: Tokens needed to be stored server-side or in cookies
3. **API Complexity**: JavaScript applications needed special handling to include tokens
4. **Maintenance**: Third-party libraries could become outdated or have vulnerabilities
5. **Performance**: Token validation required additional server-side lookups

## Enter Go 1.25: CrossOriginProtection

Go 1.25 introduces `CrossOriginProtection`, a revolutionary approach that uses modern browser headers instead of tokens. Here's the beauty of it:

```go
// NEW WAY: Using http.CrossOriginProtection
func main() {
    mux := http.NewServeMux()
    mux.HandleFunc("/", homeHandler)
    mux.HandleFunc("POST /transfer", transferHandler)
    mux.HandleFunc("DELETE /account", deleteHandler)

    // Initialize CSRF protection
    protection := http.NewCrossOriginProtection()

    // That's it! No tokens, no cookies, no state management
    http.ListenAndServe(":8080", protection.Handler(mux))
}
```

### How It Works Under the Hood

`CrossOriginProtection` leverages two key browser headers:

1. **`Sec-Fetch-Site`**: Tells the server the relationship between the request origin and the target

   - `same-origin`: Request from the same origin (always allowed)
   - `same-site`: Request from the same site but different subdomain
   - `cross-site`: Request from a different site (needs validation)
   - `none`: User navigated directly (allowed)

2. **`Origin`**: Contains the origin that initiated the request

Here's the detection flow:

```go
// Simplified logic of what CrossOriginProtection does
func (c *CrossOriginProtection) isRequestSafe(r *http.Request) bool {
    // 1. Safe methods are always allowed
    if r.Method == "GET" || r.Method == "HEAD" || r.Method == "OPTIONS" {
        return true
    }

    // 2. Check Sec-Fetch-Site header (modern browsers)
    fetchSite := r.Header.Get("Sec-Fetch-Site")
    if fetchSite == "same-origin" || fetchSite == "none" {
        return true
    }

    // 3. Fall back to Origin header comparison
    origin := r.Header.Get("Origin")
    if origin == "" {
        // No browser headers = likely API client
        return true
    }

    // 4. Check if origin matches host or is trusted
    return c.isOriginTrusted(origin, r.Host)
}
```

## Practical Implementation Examples

### Basic Setup with Zero Configuration

The simplest implementation requires zero configuration:

```go
package main

import (
    "fmt"
    "net/http"
)

func main() {
    mux := http.NewServeMux()

    // Safe methods - no state changes
    mux.HandleFunc("GET /api/users", listUsersHandler)
    mux.HandleFunc("GET /api/user/{id}", getUserHandler)

    // Unsafe methods - protected automatically
    mux.HandleFunc("POST /api/user", createUserHandler)
    mux.HandleFunc("PUT /api/user/{id}", updateUserHandler)
    mux.HandleFunc("DELETE /api/user/{id}", deleteUserHandler)

    // Zero value is perfectly valid!
    var protection http.CrossOriginProtection

    fmt.Println("Server starting on :8080")
    http.ListenAndServe(":8080", protection.Handler(mux))
}
```

### Adding Trusted Origins for Microservices

For distributed systems where you have legitimate cross-origin requests:

```go
func main() {
    mux := http.NewServeMux()
    // ... register handlers ...

    protection := http.NewCrossOriginProtection()

    // Allow your frontend domain
    protection.AddTrustedOrigin("https://app.example.com")

    // Allow your mobile app's web views
    protection.AddTrustedOrigin("https://mobile.example.com")

    // Allow local development
    if os.Getenv("ENV") == "development" {
        protection.AddTrustedOrigin("http://localhost:3000")
        protection.AddTrustedOrigin("http://localhost:5173") // Vite
    }

    http.ListenAndServe(":8080", protection.Handler(mux))
}
```

### Custom Error Responses

Improve user experience with custom error handling:

```go
protection := http.NewCrossOriginProtection()

// Set a custom deny handler
protection.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusForbidden)

    response := map[string]interface{}{
        "error": "Cross-origin request blocked",
        "message": "This request appears to come from an untrusted source",
        "timestamp": time.Now().Unix(),
    }

    // Log the attempt for security monitoring
    log.Printf("CSRF attempt blocked: %s from %s", r.URL.Path, r.Header.Get("Origin"))

    json.NewEncoder(w).Encode(response)
}))
```

### Bypass Patterns for Special Endpoints

Sometimes you need to disable CSRF for specific endpoints:

```go
protection := http.NewCrossOriginProtection()

// Webhooks often need to bypass CSRF
protection.AddInsecureBypassPattern("/api/webhook/")

// OAuth callbacks might need bypassing
protection.AddInsecureBypassPattern("/auth/callback")

// Public API endpoints
protection.AddInsecureBypassPattern("/api/public/")
```

> ⚠️ **Security Warning**: Be extremely careful with bypass patterns! In Go 1.25.0, there was a bug (CVE-2025-47910) where `AddInsecureBypassPattern("/hello/")` would also bypass `/hello` due to automatic redirects. Always use Go 1.25.1 or later and test your patterns thoroughly.

## Testing Your CSRF Protection

Here's a comprehensive test suite to ensure your CSRF protection works:

```go
func TestCSRFProtection(t *testing.T) {
    // Setup
    protection := http.NewCrossOriginProtection()
    protection.AddTrustedOrigin("https://trusted.example.com")

    handler := protection.Handler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusOK)
        w.Write([]byte("Success"))
    }))

    tests := []struct {
        name       string
        method     string
        headers    map[string]string
        wantStatus int
    }{
        {
            name:       "GET request always allowed",
            method:     "GET",
            headers:    map[string]string{"Sec-Fetch-Site": "cross-site"},
            wantStatus: http.StatusOK,
        },
        {
            name:       "Same-origin POST allowed",
            method:     "POST",
            headers:    map[string]string{"Sec-Fetch-Site": "same-origin"},
            wantStatus: http.StatusOK,
        },
        {
            name:       "Cross-site POST blocked",
            method:     "POST",
            headers:    map[string]string{"Sec-Fetch-Site": "cross-site"},
            wantStatus: http.StatusForbidden,
        },
        {
            name:       "Trusted origin POST allowed",
            method:     "POST",
            headers:    map[string]string{
                "Sec-Fetch-Site": "cross-site",
                "Origin": "https://trusted.example.com",
            },
            wantStatus: http.StatusOK,
        },
        {
            name:       "Untrusted origin POST blocked",
            method:     "POST",
            headers:    map[string]string{
                "Sec-Fetch-Site": "cross-site",
                "Origin": "https://evil.example.com",
            },
            wantStatus: http.StatusForbidden,
        },
        {
            name:       "No headers (API client) allowed",
            method:     "POST",
            headers:    map[string]string{},
            wantStatus: http.StatusOK,
        },
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            req := httptest.NewRequest(tt.method, "/api/test", nil)
            for k, v := range tt.headers {
                req.Header.Set(k, v)
            }

            rec := httptest.NewRecorder()
            handler.ServeHTTP(rec, req)

            if rec.Code != tt.wantStatus {
                t.Errorf("got status %d, want %d", rec.Code, tt.wantStatus)
            }
        })
    }
}
```

### Testing with curl

You can also test manually with curl:

```bash
# Same-origin request (allowed)
curl -X POST \
  -H "Sec-Fetch-Site: same-origin" \
  http://localhost:8080/api/transfer

# Cross-site request (blocked)
curl -X POST \
  -H "Sec-Fetch-Site: cross-site" \
  -H "Origin: https://evil.com" \
  http://localhost:8080/api/transfer

# API client without headers (allowed)
curl -X POST http://localhost:8080/api/transfer

# Trusted origin (allowed if configured)
curl -X POST \
  -H "Sec-Fetch-Site: cross-site" \
  -H "Origin: https://app.example.com" \
  http://localhost:8080/api/transfer
```

## Migration Guide: From gorilla/csrf to CrossOriginProtection

If you're currently using `gorilla/csrf`, here's how to migrate:

### Before (gorilla/csrf):

```go
package main

import (
    "github.com/gorilla/csrf"
    "github.com/gorilla/mux"
)

func main() {
    r := mux.NewRouter()

    csrfMiddleware := csrf.Protect(
        []byte("32-byte-long-auth-key"),
        csrf.Secure(false),
        csrf.HttpOnly(true),
    )

    r.HandleFunc("/form", formHandler).Methods("GET")
    r.HandleFunc("/submit", submitHandler).Methods("POST")

    http.ListenAndServe(":8080", csrfMiddleware(r))
}

func formHandler(w http.ResponseWriter, r *http.Request) {
    // Must pass token to template
    data := map[string]interface{}{
        csrf.TemplateTag: csrf.TemplateField(r),
    }
    // ... render template with CSRF token
}
```

### After (CrossOriginProtection):

```go
package main

import "net/http"

func main() {
    mux := http.NewServeMux()

    mux.HandleFunc("GET /form", formHandler)
    mux.HandleFunc("POST /submit", submitHandler)

    protection := http.NewCrossOriginProtection()

    http.ListenAndServe(":8080", protection.Handler(mux))
}

func formHandler(w http.ResponseWriter, r *http.Request) {
    // No token needed! Just render your form
    // ... render template without CSRF token
}
```

### Key Differences:

- **No secret keys** to manage or rotate
- **No tokens** to inject into forms
- **No cookies** for CSRF tokens
- **No state** to synchronize across servers
- **Better performance** without token validation overhead

## Browser Compatibility

`CrossOriginProtection` relies on modern browser headers:

| Browser      | Sec-Fetch-Site | Origin Header | Full Support |
| ------------ | -------------- | ------------- | ------------ |
| Chrome 76+   | ✅ (2019)      | ✅            | ✅           |
| Firefox 90+  | ✅ (2021)      | ✅            | ✅           |
| Safari 16.4+ | ✅ (2023)      | ✅            | ✅           |
| Edge 79+     | ✅ (2020)      | ✅            | ✅           |

For older browsers, the protection falls back to Origin header checking, which has been widely supported for years.

## Best Practices and Common Pitfalls

### 1. Never Change State on Safe Methods

```go
// ❌ WRONG - GET should never modify state
mux.HandleFunc("GET /delete-user", func(w http.ResponseWriter, r *http.Request) {
    userID := r.URL.Query().Get("id")
    deleteUser(userID) // This violates REST principles!
})

// ✅ CORRECT - Use appropriate HTTP methods
mux.HandleFunc("DELETE /user/{id}", func(w http.ResponseWriter, r *http.Request) {
    userID := r.PathValue("id")
    deleteUser(userID)
})
```

### 2. Be Cautious with Bypass Patterns

```go
// ❌ RISKY - Too broad
protection.AddInsecureBypassPattern("/api/")

// ✅ BETTER - Be specific
protection.AddInsecureBypassPattern("/api/webhooks/stripe")
protection.AddInsecureBypassPattern("/api/webhooks/github")
```

### 3. Handle Pre-flight Requests Properly

```go
mux.HandleFunc("OPTIONS /", func(w http.ResponseWriter, r *http.Request) {
    // OPTIONS is a safe method, automatically allowed
    w.Header().Set("Access-Control-Allow-Origin", "https://app.example.com")
    w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
    w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    w.WriteHeader(http.StatusOK)
})
```

### 4. Monitor and Log CSRF Attempts

```go
protection.SetDenyHandler(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
    // Log for security monitoring
    log.Printf("[SECURITY] CSRF attempt: Method=%s Path=%s Origin=%s IP=%s",
        r.Method,
        r.URL.Path,
        r.Header.Get("Origin"),
        r.RemoteAddr,
    )

    // Alert security team for repeated attempts
    if attemptCount := getAttemptCount(r.RemoteAddr); attemptCount > 5 {
        alertSecurityTeam(r)
    }

    http.Error(w, "Forbidden", http.StatusForbidden)
}))
```

## Performance Benefits

Unlike token-based CSRF protection, `CrossOriginProtection` offers significant performance advantages:

1. **No Database Lookups**: No need to validate tokens against stored values
2. **Stateless Operation**: Works perfectly with horizontal scaling
3. **No Cookie Overhead**: Reduces request/response size
4. **Memory Efficient**: No token storage in memory or cache
5. **Green Tea GC Friendly**: Works well with Go 1.25's new experimental garbage collector

## Limitations and Considerations

While `CrossOriginProtection` is excellent, be aware of these limitations:

1. **No Wildcard Origins**: You can't use patterns like `https://*.example.com`

   ```go
   // ❌ This won't work
   protection.AddTrustedOrigin("https://*.example.com")

   // ✅ Must add each subdomain explicitly
   protection.AddTrustedOrigin("https://app.example.com")
   protection.AddTrustedOrigin("https://api.example.com")
   ```

2. **Older Browser Fallback**: Very old browsers might only send Origin header
3. **Non-Browser Clients**: API clients without headers bypass protection (by design)

## Advanced Patterns

### Dynamic Origin Validation

For complex scenarios where trusted origins change dynamically:

```go
type DynamicCSRFProtection struct {
    *http.CrossOriginProtection
    getValidOrigins func() []string
}

func (d *DynamicCSRFProtection) Handler(h http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Update trusted origins dynamically
        for _, origin := range d.getValidOrigins() {
            d.AddTrustedOrigin(origin)
        }
        d.CrossOriginProtection.Handler(h).ServeHTTP(w, r)
    })
}
```

### Integration with Middleware Chains

```go
func main() {
    mux := http.NewServeMux()
    // ... register handlers ...

    protection := http.NewCrossOriginProtection()

    // Chain with other middleware
    handler := loggingMiddleware(
        rateLimitMiddleware(
            protection.Handler(
                authMiddleware(mux),
            ),
        ),
    )

    http.ListenAndServe(":8080", handler)
}
```

## Conclusion

Go 1.25's `CrossOriginProtection` represents a paradigm shift in CSRF protection. By leveraging modern browser capabilities instead of managing tokens, it provides:

- **Simpler implementation** with less code
- **Better performance** without state management
- **Improved developer experience** without token injection
- **Enhanced security** with less room for implementation errors

If you're starting a new project in Go 1.25+, use `CrossOriginProtection`. If you're maintaining an existing application with token-based CSRF protection, consider migrating—the benefits are substantial and the migration path is straightforward.

## Resources and Further Reading

- [Official Go 1.25 Release Notes](https://go.dev/doc/go1.25)
- [CSRF Protection Proposal (#73626)](https://github.com/golang/go/issues/73626)
- [MDN: Sec-Fetch-Site Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-Fetch-Site)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
- [filippo.io/csrf - Backport for older Go versions](https://pkg.go.dev/filippo.io/csrf)

---

Have you migrated to `CrossOriginProtection` yet? What's your experience with CSRF protection in Go? Reach out on [Twitter/X](https://twitter.com/thesambayo)
