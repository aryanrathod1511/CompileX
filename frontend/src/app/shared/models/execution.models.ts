// ----- Language Types -----

export type Language = 
  | 'python' 
  | 'r' 
  | 'sql' 
  | 'html' 
  | 'java' 
  | 'kotlin' 
  | 'c' 
  | 'cpp' 
  | 'csharp' 
  | 'javascript' 
  | 'typescript' 
  | 'go';

export interface LanguageOption {
  value: Language;
  label: string;
  monoLabel: string; // Short label shown in tabs
  filename: string;
  defaultCode: string;
  isSupported: boolean;
  svgIcon: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  {
    value: 'python',
    label: 'Python',
    monoLabel: 'PY',
    filename: 'main.py',
    isSupported: true,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><path d="M11.83 1.02c-1.8 0-3.37.13-4.66.38-2.52.48-3.4 1.76-3.4 4.31v1.94h8.33v1.17H3.77c-2.45 0-3.77 1.4-3.77 3.86v4.66c0 2.45 1.5 3.65 3.96 3.65h1.76v-2.43c0-1.74 1.42-3.15 3.16-3.15h5.18c1.74 0 3.16-1.42 3.16-3.16V5.07c0-2.45-1.57-3.72-4.04-4.01-1.28-.15-2.73-.04-4.57-.04z" fill="#387EB8"/><path d="M12.17 22.98c1.8 0 3.37-.13 4.66-.38 2.52-.48 3.4-1.76 3.4-4.31v-1.94H11.9v-1.17h8.33c2.45 0 3.77-1.4 3.77-3.86V8.66c0-2.45-1.5-3.65-3.96-3.65h-1.76v2.43c0 1.74-1.42 3.15-3.16 3.15H9.94c-1.74 0-3.16 1.42-3.16 3.16v5.18c0 2.45 1.57 3.72 4.04 4.01 1.28.15 2.73.04 4.57.04z" fill="#FFE052"/></svg>`,
    defaultCode: `# Python — interactive example
name = input("Enter your name: ")
print(f"Hello, {name}! Welcome to CompileX.")
`,
  },
  {
    value: 'r',
    label: 'R',
    monoLabel: 'R',
    filename: 'main.r',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><ellipse cx="12" cy="12" rx="10" ry="7.5" fill="#cbd5e1" stroke="#475569" stroke-width="1.5"/><text x="12" y="16.5" font-family="sans-serif" font-weight="bold" font-size="13" fill="#1e3a8a" text-anchor="middle">R</text></svg>`,
    defaultCode: `# R — coming soon
cat("Hello from R compiler!\n")
`,
  },
  {
    value: 'sql',
    label: 'SQL',
    monoLabel: 'SQL',
    filename: 'query.sql',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#22d3ee" stroke-width="2" class="w-full h-full"><ellipse cx="12" cy="5" rx="9" ry="3" fill="#0891b2" fill-opacity="0.2"/><path d="M3 5v14a9 3 0 0 0 18 0V5" fill="#0891b2" fill-opacity="0.1"/><path d="M3 12a9 3 0 0 0 18 0" fill="none"/></svg>`,
    defaultCode: `-- SQL Query — coming soon
SELECT 'Hello World from SQL!' AS greeting;
`,
  },
  {
    value: 'html',
    label: 'HTML5',
    monoLabel: 'HTML',
    filename: 'index.html',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#E34F26" class="w-full h-full"><path d="M1.5 0h21l-1.91 21.56L12 24l-8.59-2.44L1.5 0z"/><path d="M12 2.18v19.67l6.83-1.94L20.3 3.65H12z" fill="#EF652A"/><path d="M12 9.53H8.38l-.25-2.8H12V4.08H5.13l.77 8.6h6.1v-3.15zM12 16.29l-.03.01-3.12-.84-.2-2.22H5.73l.39 4.38L12 19.38v-3.09z" fill="#FFF"/><path d="M12 9.53h3.6l-.34 3.79-3.26.88v3.09l5.88-1.59.8-8.87H12v3.21z" fill="#EBEBEB"/></svg>`,
    defaultCode: `<!DOCTYPE html>
<html>
<head>
    <title>HTML5 Sandbox</title>
</head>
<body>
    <h1>Hello, World!</h1>
</body>
</html>
`,
  },
  {
    value: 'java',
    label: 'Java',
    monoLabel: 'JAVA',
    filename: 'Main.java',
    isSupported: true,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><path d="M2 17c0 2 2 3 5 3h6c3 0 5-1 5-3v-4H2v4z" fill="#f97316"/><path d="M18 10c2 0 3 1 3 3s-1 3-3 3h-1v-6h1z" stroke="#f97316" stroke-width="2"/><path d="M6 8c1-2-1-4 1-6M10 8c1-2-1-4 1-6M14 8c1-2-1-4 1-6" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    defaultCode: `// Java — interactive example
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        System.out.print("Enter your name: ");
        String name = sc.nextLine();
        System.out.println("Hello, " + name + "! Welcome to CompileX.");
    }
}
`,
  },
  {
    value: 'kotlin',
    label: 'Kotlin',
    monoLabel: 'KT',
    filename: 'main.kt',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" class="w-full h-full"><path d="M24 24H0V0h24L12 12z" fill="url(#kotlin-grad)"/><defs><linearGradient id="kotlin-grad" x1="24" y1="0" x2="0" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#E10098"/><stop offset="0.5" stop-color="#7F52FF"/><stop offset="1" stop-color="#00AFFF"/></linearGradient></defs></svg>`,
    defaultCode: `// Kotlin — coming soon
fun main() {
    println("Hello, Kotlin!")
}
`,
  },
  {
    value: 'c',
    label: 'C',
    monoLabel: 'C',
    filename: 'main.c',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#0284c7" fill-opacity="0.2" stroke="#0284c7" stroke-width="1.8"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="12" fill="#e0f2fe" text-anchor="middle">C</text></svg>`,
    defaultCode: `// C — coming soon
#include <stdio.h>

int main() {
    printf("Hello from C!\n");
    return 0;
}
`,
  },
  {
    value: 'cpp',
    label: 'C++',
    monoLabel: 'C++',
    filename: 'main.cpp',
    isSupported: true,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#6366f1" fill-opacity="0.2" stroke="#6366f1" stroke-width="1.8"/><text x="12" y="16.5" font-family="sans-serif" font-weight="bold" font-size="10.5" fill="#e0e7ff" text-anchor="middle">C++</text></svg>`,
    defaultCode: `// C++ — interactive example
#include <iostream>
#include <string>
using namespace std;

int main() {
    string name;
    cout << "Enter your name: ";
    cin >> name;
    cout << "Hello, " << name << "! Welcome to CompileX." << endl;
    return 0;
}
`,
  },
  {
    value: 'csharp',
    label: 'C#',
    monoLabel: 'C#',
    filename: 'Program.cs',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><polygon points="12,2 22,7 22,17 12,22 2,17 2,7" fill="#a855f7" fill-opacity="0.2" stroke="#a855f7" stroke-width="1.8"/><text x="12" y="16" font-family="sans-serif" font-weight="bold" font-size="11" fill="#faf5ff" text-anchor="middle">C#</text></svg>`,
    defaultCode: `// C# — coming soon
using System;

class Program {
    static void Main() {
        Console.WriteLine("Hello, C#!");
    }
}
`,
  },
  {
    value: 'javascript',
    label: 'JS',
    monoLabel: 'JS',
    filename: 'main.js',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#F7DF1E" class="w-full h-full"><rect width="24" height="24" rx="3"/><text x="17" y="19" font-family="sans-serif" font-weight="bold" font-size="11.5" fill="#000" text-anchor="middle">JS</text></svg>`,
    defaultCode: `// JavaScript — coming soon
console.log("Hello, JavaScript!");
`,
  },
  {
    value: 'typescript',
    label: 'TS',
    monoLabel: 'TS',
    filename: 'main.ts',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="#3178C6" class="w-full h-full"><rect width="24" height="24" rx="3"/><text x="17" y="19" font-family="sans-serif" font-weight="bold" font-size="11.5" fill="#FFF" text-anchor="middle">TS</text></svg>`,
    defaultCode: `// TypeScript — coming soon
const msg: string = "Hello, TypeScript!";
console.log(msg);
`,
  },
  {
    value: 'go',
    label: 'Go',
    monoLabel: 'GO',
    filename: 'main.go',
    isSupported: false,
    svgIcon: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" class="w-full h-full"><rect width="24" height="24" rx="3" fill="#00ADD8" fill-opacity="0.1" stroke="#00ADD8" stroke-width="1.8"/><text x="12" y="15.5" font-family="sans-serif" font-weight="bold" font-size="10.5" fill="#00ADD8" text-anchor="middle">GO</text></svg>`,
    defaultCode: `// Go — coming soon
package main

import "fmt"

func main() {
    fmt.Println("Hello, Go!")
}
`,
  }
];

// ----- Execution Status -----

export type ExecutionStatus = 'idle' | 'connecting' | 'running' | 'finished' | 'error';

// ----- WebSocket Message Shapes -----

export interface WsInitPacket {
  type: 'init';
  language: Language;
  code: string;
}

export interface WsInputPacket {
  type: 'input';
  input: string;
}

export type WsOutboundPacket = WsInitPacket | WsInputPacket;
