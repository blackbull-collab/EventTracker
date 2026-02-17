# CampusX Deployment Guide

## Pre-Deployment Checklist

Before deploying to production, verify:

```bash
# 1. Verify all files are present
ls -la index.html clubs.html sw.js manifest.json sitemap.xml robots.txt

# 2. Check service worker syntax
cat sw.js | head -20

# 3. Verify SEO meta tags
grep "og:title\|twitter:card" index.html

# 4. Test locally
python -m http.server 8000
# Visit http://localhost:8000 and test offline mode (DevTools → Network → Offline)
```

## Deployment Steps

### Netlify (Recommended)

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Link project
netlify link

# 3. Deploy
netlify deploy --prod

# 4. Verify deployment
# Check Build logs for success
# Test HTTPS certificate is valid
# Verify service worker registration (DevTools → Application)
```

### Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy
vercel --prod

# 3. Custom domain (optional)
vercel domain add campus-x.your-domain.com
```

### Docker (Self-Hosted)

```dockerfile
# Dockerfile
FROM nginx:alpine

COPY .htaccess /etc/nginx/conf.d/security.conf
COPY . /usr/share/nginx/html/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Build and run
docker build -t campus-x .
docker run -p 80:80 campus-x
```

### Manual Apache Upload

```bash
# 1. Connect via SFTP
sftp -i ~/.ssh/key.pem user@server.com

# 2. Upload all files
put -r . /var/www/html/campus-x/

# 3. Set permissions
chmod 755 /var/www/html/campus-x
chmod 644 /var/www/html/campus-x/*.html

# 4. Ensure .htaccess is readable
chmod 644 /var/www/html/campus-x/.htaccess

# 5. Restart Apache
sudo systemctl restart apache2
```

## Post-Deployment Verification

### 1. Page Load Test
```bash
# Using curl to check response headers
curl -I https://your-domain.com/index.html

# Expected: 200 OK
# Check for Cache-Control and security headers

# Expected headers:
# Strict-Transport-Security
# X-Content-Type-Options: nosniff
# X-Frame-Options: SAMEORIGIN
```

### 2. Service Worker Test
```
1. Open DevTools (F12)
2. Go to Application → Service Workers
3. Verify sw.js is registered & active
4. Set network to "Offline"
5. Refresh page
6. Should show offline.html content
```

### 3. SEO Verification
```
1. Test with Google Search Console
2. Submit sitemap: https://your-domain.com/sitemap.xml
3. Check robots.txt: https://your-domain.com/robots.txt
4. Verify canonical URLs in each page
```

### 4. Lighthouse Audit
```bash
# Using Lighthouse CLI
npm install -g lighthouse

lighthouse https://your-domain.com/index.html --view

# Target scores:
# Performance: 90+
# SEO: 100
# Accessibility: 95+
# Best Practices: 95+
```

### 5. Mobile Testing
- Test on iPhone 12/14 (iOS Safari)
- Test on Android (Chrome)
- Verify PWA install prompts appear
- Test offline mode on mobile

### 6. Cross-Browser Testing
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Test checklist:
- [ ] All pages render correctly
- [ ] Forms are functional
- [ ] Links navigate properly
- [ ] Responsive design works
- [ ] Smooth animations visible
- [ ] No console errors

## Performance Optimization

### Enable Compression on Server

**Apache (.htaccess already includes):**
```apache
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/css application/javascript
</IfModule>
```

**Nginx:**
```nginx
gzip on;
gzip_types text/html text/css application/javascript;
gzip_min_length 1000;
```

### CDN Configuration

For optimal performance, use a CDN like Cloudflare:

1. Add domain to Cloudflare
2. Change nameservers at registrar
3. Enable caching rules:
   - `/assets/*` → Cache for 1 year
   - `/styles/*` → Cache for 1 month
   - `/*.html` → Cache for 1 day
   - `/sw.js` → Don't cache

### Analytics Setup

Add analytics (respecting privacy):

```html
<!-- Plausible Analytics (privacy-friendly) -->
<script defer data-domain="your-domain.com" src="https://plausible.io/js/script.js"></script>
```

Or Google Analytics 4:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## Monitoring & Maintenance

### Uptime Monitoring

Set up monitoring with:
- Pingdom or UptimeRobot
- Alert threshold: 5 minutes
- Check frequency: Every 5 minutes

### Error Tracking

Set up Sentry for error tracking:

```html
<script>
  Sentry.init({
    dsn: "https://[key]@sentry.io/[project-id]",
    environment: "production",
    tracesSampleRate: 0.1
  });
</script>
```

### Performance Monitoring

Monitor Core Web Vitals:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Cumulative Layout Shift (CLS)
- First Input Delay (FID)

## Domain Configuration

### DNS Setup

```
Type  Name              Value
A     @                 xx.xxx.xxx.xxx  (Server IP)
A     www               xx.xxx.xxx.xxx
MX    @                 mail.your-domain.com (if needed)
```

### SSL Certificate

```bash
# Using Let's Encrypt (free)
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com -d www.your-domain.com

# Auto-renewal
sudo systemctl enable certbot-renew.timer
```

## Rollback Procedure

If issues occur after deployment:

```bash
# Keep previous deployment tagged
git tag v1.0.0
git push origin v1.0.0

# To rollback
git checkout v1.0.0
# Re-deploy using your CI/CD pipeline
```

## Troubleshooting

### Service Worker Not Registering
- Check HTTPS is enabled
- Verify sw.js is accessible at `/sw.js`
- Check browser console for errors
- Clear service worker cache (DevTools → Storage → Clear site data)

### Offline Page Not Showing
- Verify `/offline.html` exists
- Check service worker fetch event handlers
- Test with `curl -I https://your-domain.com/offline.html`

### Slow Page Load
- Run Lighthouse audit
- Check server response time
- Verify CDN cache is working
- Profile JavaScript execution

### High Bounce Rate
- Check 404 errors in logs
- Verify internal links work
- Test mobile responsiveness
- Check page load time

## Support

For deployment issues:
1. Check server logs (`/var/log/apache2/error.log` or equivalent)
2. Test locally first
3. Check CDN cache settings
4. Verify DNS propagation (use `nslookup` or `dig`)

---

**Questions?** Open an issue or check the main README.md for more info.
