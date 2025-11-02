Cleanup steps to fully remove Mongo/Mongoose references

You have migrated the code to ArangoDB. One remaining place with historical Mongo/Mongoose references is `package-lock.json` which was generated earlier and still lists Mongo packages.

Follow these steps locally to fully remove Mongo references and regenerate a clean lockfile:

1) In project root, uninstall mongoose (if present):

```powershell
npm uninstall mongoose
```

2) Remove `package-lock.json` and `node_modules` to ensure a clean install:

```powershell
Remove-Item package-lock.json -Force -ErrorAction SilentlyContinue
Remove-Item -Recurse node_modules -Force -ErrorAction SilentlyContinue
```

3) Install dependencies (this will regenerate `package-lock.json` without Mongo/Mongoose):

```powershell
npm install --no-audit --no-fund
```

4) (Optional) Verify there are no remaining references:

```powershell
Select-String -Path .\**\* -Pattern 'mongoose|MONGO_URI|MongoDB|mongodb' -SimpleMatch
```

If the command returns results only in `package-lock.json` before step 2, you are good after step 3.

Notes
- If you use CI or deployment pipelines, remember to update them to set the correct ArangoDB environment variables (ARANGO_URL, ARANGO_DB_NAME, ARANGO_USERNAME, ARANGO_PASSWORD) and remove any references to MONGO_URI.
- If you'd like, I can also create a small script (`scripts/cleanup-mongo.ps1`) to run these commands for you locally. Ask and I'll add it.
