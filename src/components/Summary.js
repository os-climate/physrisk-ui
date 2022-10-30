import * as React from "react"
import { useTheme } from "@mui/material/styles"
import Link from "@mui/material/Link"
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math'
import rehypeMathjax from 'rehype-mathjax'
import remarkGfm from 'remark-gfm'

import 'katex/dist/katex.min.css' // `rehype-katex` does not import the CSS for you
import { Box } from "@mui/material"

export default function Summary(props) {
    const { modelDescription } = props
    const theme = useTheme()

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
