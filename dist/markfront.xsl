<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.1">
    <xsl:output method="html" />

    <xsl:template match="/mf">
        <xsl:call-template name="html">
            <xsl:with-param name="baseURI" select="@base" />
            <xsl:with-param name="lang" select="@lang" />
            <xsl:with-param name="content">
                <xsl:copy-of select="node()" />
            </xsl:with-param>
        </xsl:call-template>
    </xsl:template>
    <xsl:template match="/mf-text">
        <xsl:call-template name="html">
            <xsl:with-param name="baseURI" select="@base" />
            <xsl:with-param name="lang" select="@lang" />
            <xsl:with-param name="content">
                <mf-text>
                    <xsl:copy-of select="node()" />
                </mf-text>
            </xsl:with-param>
        </xsl:call-template>
    </xsl:template>

    <xsl:template name="html">
        <xsl:param name="baseURI" />
        <xsl:param name="lang" />
        <xsl:param name="content" />
        <html class="mf" lang="{$lang}">
            <head>
                <title>Markfront Document</title>
                <style type="text/css">
                    <!-- Fallback -->
                    .mf:not(.mf-processed) mf-text {
                        white-space: pre;
                        font-family: monospace;
                    }
                    @media (prefers-color-scheme: dark) {
                        .mf:not(.mf-processed) {
                            background: #222;
                            color: #eee;
                        }
                    }
                </style>
            </head>
            <body>
                <xsl:copy-of select="$content" />
                <script src="{$baseURI}markfront.js" type="application/javascript"></script>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
