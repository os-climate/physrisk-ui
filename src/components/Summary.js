import * as React from "react"
import { useTheme } from "@mui/material/styles"
import Link from "@mui/material/Link"
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import { Box, Typography } from "@mui/material"

function preventDefault(event) {
    event.preventDefault()
}

export default function Summary(props) {
    const { modelDescription } = props
    console.log(modelDescription)
    const theme = useTheme()

    const markdown = `A paragraph with *emphasis* and **strong importance**.

> A block quote with ~strikethrough~ and a URL: https://reactjs.org.

* Lists
* [ ] todo
* [x] done

A table:

| a | b |
| - | - |
`
    // remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]} style={theme.typography.body2}>

    return (
        <Box style={theme.typography.body2}>
            <ReactMarkdown  
                remarkPlugins={[remarkGfm, remarkMath]} 
                rehypePlugins={[rehypeMathjax]}
                components={{
                    a: props => {
                        return (
                            <Link color="primary" target="_blank" href={props.href}>{props.children}</Link>
                        )
                    }
                }}
                >
                {modelDescription}
            </ReactMarkdown>
        </Box>
    )
}
