import { readdirSync, readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { resolve, extname } from 'path'
import { abi } from 'thor-devkit';


const baseDir = resolve(__dirname, 'ABIs')
const outputDir = resolve(__dirname, 'dist', 'q')
const entries = readdirSync(baseDir, { withFileTypes: true })

const fsOpt = { encoding: 'utf8' }

mkdirSync(outputDir, { recursive: true })

entries.forEach(v => {
    if (!v.isFile() || v.name.startsWith('.')) {
        return
    }
    const str = readFileSync(resolve(baseDir, v.name), fsOpt)
    const abiJSONArray = JSON.parse(str)
    if (!Array.isArray(abiJSONArray)) {
        throw new Error('ABI expected array')
    }

    abiJSONArray.forEach(abiJSON => save(abiJSON, v.name.slice(0, -extname(v.name).length)))
})


function save(jsonABI: any, contractName: string) {
    jsonABI = { ...jsonABI, $contractName: contractName }
    let sig = ''
    if (jsonABI.type === 'event') {
        const ev = new abi.Event(jsonABI)
        sig = ev.signature
    } else {
        if (!jsonABI.inputs) {
            // fallback / constructor
            return
        }
        const fn = new abi.Function(jsonABI)
        sig = fn.signature
    }

    const path = resolve(outputDir, sig + '.json')
    if (existsSync(path)) {
        const exist = JSON.parse(readFileSync(path, fsOpt)) as any[]
        exist.push(jsonABI)
        writeFileSync(path, JSON.stringify(exist), fsOpt)
    } else {
        writeFileSync(path, JSON.stringify([jsonABI]), fsOpt)
    }
}
