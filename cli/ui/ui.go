package ui

import (
	"fmt"
	"os"

	"github.com/fatih/color"
	"github.com/olekukonko/tablewriter"
)

var (
	Success    = color.New(color.FgGreen, color.Bold).SprintfFunc()
	Error      = color.New(color.FgRed, color.Bold).SprintfFunc()
	Info       = color.New(color.FgCyan).SprintfFunc()
	Warning    = color.New(color.FgYellow).SprintfFunc()
	Highlight  = color.New(color.FgMagenta, color.Bold).SprintfFunc()
	GreenBold  = color.New(color.FgGreen, color.Bold)
	RedBold    = color.New(color.FgRed, color.Bold)
	CyanBold   = color.New(color.FgCyan, color.Bold)
	YellowBold = color.New(color.FgYellow, color.Bold)
)

func CreateTable(headers []string) *tablewriter.Table {
	table := tablewriter.NewTable(os.Stdout)
	headersAny := make([]any, len(headers))
	for i, h := range headers {
		headersAny[i] = h
	}
	table.Header(headersAny...)
	return table
}

func PrintSuccess(format string, args ...any) {
	GreenBold.Print("✓ ")
	fmt.Printf(format+"\n", args...)
}

func PrintError(format string, args ...any) {
	RedBold.Fprint(os.Stderr, "✗ ")
	fmt.Fprintf(os.Stderr, format+"\n", args...)
}

func PrintWarning(format string, args ...any) {
	YellowBold.Fprint(os.Stderr, "⚠ ")
	fmt.Fprintf(os.Stderr, format+"\n", args...)
}

func PrintInfo(format string, args ...any) {
	CyanBold.Print("• ")
	fmt.Printf(format+"\n", args...)
}
