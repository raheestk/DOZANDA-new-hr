const fs = require('fs');
const files = [
  "frontend/src/pages/Vehicles.jsx",
  "frontend/src/pages/PendingCheques.jsx",
  "frontend/src/pages/Employees.jsx",
  "frontend/src/pages/Dashboard.jsx",
  "frontend/src/pages/CompanyDocs.jsx",
  "frontend/src/pages/ClearedCheques.jsx",
  "frontend/src/components/Layout.jsx"
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/const API = 'http:\/\/localhost:5000';/g, "const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';");
  fs.writeFileSync(f, content);
});

let loginPath = "frontend/src/pages/Login.jsx";
let loginContent = fs.readFileSync(loginPath, 'utf8');
if (!loginContent.includes('const API')) {
  loginContent = loginContent.replace("export default function Login() {", "const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';\n\nexport default function Login() {");
}
loginContent = loginContent.replace(/'http:\/\/localhost:5000\/api\/auth\/login'/g, "`${API}/api/auth/login`");
fs.writeFileSync(loginPath, loginContent);

console.log("All API URLs successfully converted to dynamic VITE_API_URL");
