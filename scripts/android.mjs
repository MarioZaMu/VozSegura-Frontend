// Builds and installs the Android app without opening Android Studio.
//   node scripts/android.mjs build    → android/app/build/outputs/apk/debug/app-debug.apk
//   node scripts/android.mjs install  → installs that APK on the phone connected by USB
// Gradle 8.14 (Capacitor 8) needs JDK 17–21. JAVA_HOME on this PC and Android Studio's JBR
// are Java 25, which fails with "Unsupported class file major version 69", so the global
// JAVA_HOME is ignored: the first JDK found below is used. Set ANDROID_JAVA_HOME to force
// another one, and ANDROID_HOME for a non-default SDK.
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'

const isWindows = process.platform === 'win32'
const androidDir = join(import.meta.dirname, '..', 'android')
const apkPath = join(androidDir, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk')

const javaCandidates = [
  process.env.ANDROID_JAVA_HOME,
  'C:\\Program Files\\Java\\jdk-21.0.12',
  'C:\\Program Files\\Android\\Android Studio\\jbr',
].filter(Boolean)
const javaHome = javaCandidates.find((path) => existsSync(path))
const sdkDir = process.env.ANDROID_HOME ?? join(process.env.LOCALAPPDATA ?? '', 'Android', 'Sdk')

function run(command, args, options = {}) {
  console.log(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, { stdio: 'inherit', shell: isWindows, ...options })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

function build() {
  if (!javaHome) {
    console.error('No se encontró un JDK 17–21. Define ANDROID_JAVA_HOME.')
    process.exit(1)
  }
  console.log(`JDK: ${javaHome}`)
  // Absolute path: some shells do not look for executables in the current directory.
  const gradlew = join(androidDir, isWindows ? 'gradlew.bat' : 'gradlew')
  run(`"${gradlew}"`, ['assembleDebug'], {
    cwd: androidDir,
    env: { ...process.env, JAVA_HOME: javaHome, ANDROID_HOME: sdkDir },
  })
  console.log(`\nAPK listo: ${apkPath}`)
}

function install() {
  if (!existsSync(apkPath)) {
    console.error('No hay APK. Corre primero: npm run android:build')
    process.exit(1)
  }
  const adb = join(sdkDir, 'platform-tools', isWindows ? 'adb.exe' : 'adb')
  run(`"${adb}"`, ['install', '-r', `"${apkPath}"`])
}

const commands = { build, install }
const command = commands[process.argv[2]]
if (!command) {
  console.error('Uso: node scripts/android.mjs <build|install>')
  process.exit(1)
}
command()
