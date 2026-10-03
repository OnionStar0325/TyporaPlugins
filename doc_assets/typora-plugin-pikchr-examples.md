# Pikchr Examples for Typora

> **Source & References**:
> - Official Documentation & Examples: [https://pikchr.org/home/doc/trunk/doc/examples.md](https://pikchr.org/home/doc/trunk/doc/examples.md)
> - Official Website: [https://pikchr.org](https://pikchr.org)
> - SQLite Architecture Reference: [https://www.sqlite.org/arch.html](https://www.sqlite.org/arch.html)
>
> *Note: In Typora, create a fenced code block with `pikchr` to render real-time SVG diagrams in both Light & Dark modes.*

---

## 1. Usage Note (Box & Text Styling)

This example demonstrates creating a highlighted container box with customized border color and multi-line centered text.

```pikchr
box color red wid 2.6in \
    "Click on any diagram on this page" big \
    "to see the Pikchr source text" big
```

---

## 2. Markdown to SVG Pipeline

A typical processing pipeline showing how Markdown and Pikchr work together to generate HTML and SVG outputs.

```pikchr
arrow right 200% "Markdown" "Source"
box rad 10px "Markdown" "Formatter" "(markdown.c)" fit
arrow right 200% "HTML+SVG" "Output"
arrow <-> down 70% from last box.s
box same "Pikchr" "Formatter" "(pikchr.c)" fit
```

---

## 3. How To Build Pikchr (Build & Compilation Flow)

Demonstrating file objects, rounded ovals, multi-segment connector arrows, labeled branches, and custom spacing.

```pikchr
            filewid *= 1.2
  Src:      file "pikchr.y"; move
  LemonSrc: file "lemon.c"; move
  Lempar:   file "lempar.c"; move
            arrow down from LemonSrc.s
  CC1:      oval "C-Compiler" ht 50%
            arrow " generates" ljust above
  Lemon:    oval "lemon" ht 50%
            arrow from Src chop down until even with CC1 \
              then to Lemon.nw rad 20px
            "Pikchr source " rjust "code input " rjust \
              at 2nd vertex of previous
            arrow from Lempar chop down until even with CC1 \
              then to Lemon.ne rad 20px
            " parser template" ljust " resource file" ljust \
              at 2nd vertex of previous
  PikSrc:   file "pikchr.c" with .n at lineht below Lemon.s
            arrow from Lemon to PikSrc chop
            arrow down from PikSrc.s
  CC2:      oval "C-Compiler" ht 50%
            arrow
  Out:      file "pikchr.o" "or" "pikchr.exe" wid 110%
```

---

## 4. SQLite Architecture Diagram

Inspired by the SQLite architectural overview at [sqlite.org/arch.html](https://www.sqlite.org/arch.html). Demonstrates complex nested layouts, background grouped regions (`behind`), rotated vertical text labels (`aligned`), and fractional positioning.

```pikchr
    lineht *= 0.4
    $margin = lineht*2.5
    scale = 0.75
    fontscale = 1.1
    charht *= 1.15
    down
In: box "Interface" wid 150% ht 75% fill white
    arrow
CP: box same "SQL Command" "Processor"
    arrow
VM: box same "Virtual Machine"
    arrow down 1.25*$margin
BT: box same "B-Tree"
    arrow
    box same "Pager"
    arrow
OS: box same "OS Interface"
    box same with .w at 1.25*$margin east of 1st box.e "Tokenizer"
    arrow
    box same "Parser"
    arrow
CG: box same ht 200% "Code" "Generator"
UT: box same as 1st box at (Tokenizer,Pager) "Utilities"
    move lineht
TC: box same "Test Code"
    arrow from CP to 1/4<Tokenizer.sw,Tokenizer.nw> chop
    arrow from 1/3<CG.nw,CG.sw> to CP chop

    box ht (In.n.y-VM.s.y)+$margin wid In.wid+$margin \
       at CP fill 0xd8ecd0 behind In
    line invis from 0.25*$margin east of last.sw up last.ht \
        "Core" italic aligned

    box ht (BT.n.y-OS.s.y)+$margin wid In.wid+$margin \
       at Pager fill 0xd0ece8 behind In
    line invis from 0.25*$margin east of last.sw up last.ht \
       "Backend" italic aligned

    box ht (Tokenizer.n.y-CG.s.y)+$margin wid In.wid+$margin \
       at 1/2<Tokenizer.n,CG.s> fill 0xe8d8d0 behind In
    line invis from 0.25*$margin west of last.se up last.ht \
       "SQL Compiler" italic aligned

    box ht (UT.n.y-TC.s.y)+$margin wid In.wid+$margin \
       at 1/2<UT,TC> fill 0xe0ecc8 behind In
    line invis from 0.25*$margin west of last.se up last.ht \
      "Accessories" italic aligned
```

---

## 5. Basic Shapes & Primitives

Pikchr supports multiple primary geometric shapes: `box`, `circle`, `ellipse`, `oval`, `cylinder`, `file`, `dot`, and `line`/`arrow`.

```pikchr
box "box"
move
circle "circle"
move
ellipse "ellipse"
move
oval "oval"
move
cylinder "cylinder"
move
file "file"
```

---

## 6. Flowchart & Decision Tree

Example showing decision trees with branch conditions and directional routing.

```pikchr
down
Start: box "Start" rad 10px
arrow
D1: diamond "Is valid?" fit
arrow "yes" ljust
box "Process Request"
arrow
box "Success" rad 10px

arrow from D1.e right 1.2in "no" above
box "Log Error"
arrow down 0.8in
box "Abort" rad 10px
```

---

## 7. Colors and Styling

Demonstrating custom stroke colors, fill colors, and line dashes.

```pikchr
right
box "Default"
move
box "Red Fill" fill 0xffcccc color red
move
box "Blue Dashed" dashed color blue
move
box "Thick Green" thick color green fill 0xccffcc
```
