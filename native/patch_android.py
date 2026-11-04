#!/usr/bin/env python3
"""Popravki generiranega Android projekta: kamera, ikona, pokončna usmerjenost, številka različice."""
import os, re, shutil, sys, glob

ANDROID = 'android'
APP = os.path.join(ANDROID, 'app')
MAIN = os.path.join(APP, 'src', 'main')
run = os.environ.get('RUN_NUMBER', '1')

# 1) AndroidManifest: dovoljenje za kamero (skener QR in fotografije) + pokončno
mp = os.path.join(MAIN, 'AndroidManifest.xml')
m = open(mp, encoding='utf-8').read()
if 'android.permission.CAMERA' not in m:
    add = ('    <uses-permission android:name="android.permission.CAMERA" />\n'
           '    <uses-feature android:name="android.hardware.camera" android:required="false" />\n'
           '    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />\n')
    assert '</manifest>' in m, 'AndroidManifest.xml nima </manifest>'
    m = m.replace('</manifest>', add + '</manifest>')
if 'screenOrientation' not in m:
    m2 = re.sub(r'(android:name="\.MainActivity")', r'\1\n            android:screenOrientation="portrait"', m, count=1)
    if m2 == m: print('OPOZORILO: MainActivity ni najden, usmerjenost ni nastavljena')
    m = m2
open(mp, 'w', encoding='utf-8').write(m)
print('Manifest: OK')

# 2) Ikona
res = os.path.join(MAIN, 'res')
for root, _, files in os.walk('native/res'):
    for f in files:
        src = os.path.join(root, f)
        dst = os.path.join(res, os.path.relpath(src, 'native/res'))
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copyfile(src, dst)
# stari zagonski zaslon (logotip Capacitor) -> enobarvna podlaga
n = 0
for p in glob.glob(os.path.join(res, '**', 'splash.png'), recursive=True):
    shutil.copyfile('native/splash.png', p); n += 1
print(f'Ikona: OK, zagonski zaslon zamenjan na {n} mestih')

# 3) Številka različice (vsak nov APK mora imeti večjo številko, da se namesti čez starega)
bg = os.path.join(APP, 'build.gradle')
if not os.path.exists(bg): bg = os.path.join(APP, 'build.gradle.kts')
g = open(bg, encoding='utf-8').read()
g2 = re.sub(r'(versionCode\s*=?\s*)\d+', lambda x: x.group(1) + run, g, count=1)
g2 = re.sub(r'(versionName\s*=?\s*)"[^"]*"', lambda x: x.group(1) + f'"1.{run}"', g2, count=1)
if g2 == g: print('OPOZORILO: versionCode ni najden, ostane 1')
open(bg, 'w', encoding='utf-8').write(g2)
print('Različica: 1.' + run)
