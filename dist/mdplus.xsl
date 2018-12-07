<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.1">
    <xsl:output method="html" />

    <xsl:template match="/mdp">
        <xsl:call-template name="html">
            <xsl:with-param name="baseURI" select="@base" />
            <xsl:with-param name="content">
                <xsl:value-of select="." />
            </xsl:with-param>
        </xsl:call-template>
    </xsl:template>
    <xsl:template match="/mdp-text">
        <xsl:call-template name="html">
            <xsl:with-param name="baseURI" select="@base" />
            <xsl:with-param name="content">
                <mdp-text><xsl:value-of select="." /></mdp-text>
            </xsl:with-param>
        </xsl:call-template>
    </xsl:template>

    <xsl:template name="html">
        <xsl:param name="baseURI" />
        <xsl:param name="content" />
        <html class="mdp">
            <head>
                <title>Markdeep Plus Document</title>
                <style type="text/css">
                    <!-- Fallback -->
                    .mdp:not(.mdp-processed) mdp-text {
                        white-space: pre;
                        font-family: monospace;
                    }
                    @media (prefers-color-scheme: dark) {
                        .mdp:not(.mdp-processed) {
                            background: #222;
                            color: #eee;
                        }
                    }
                </style>
            </head>
            <body>
                <xsl:copy-of select="$content" />
                <script src="{$baseURI}mdplus.js" type="application/javascript"></script>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
