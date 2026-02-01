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

// CreateTable creates a new styled table
func CreateTable(headers []string) *tablewriter.Table {
	table := tablewriter.NewTable(os.Stdout)
	headersAny := make([]any, len(headers))
	for i, h := range headers {
		headersAny[i] = h
	}
	table.Header(headersAny...)
	return table
}

// PrintSuccess prints a success message with checkmark
func PrintSuccess(format string, args ...any) {
	GreenBold.Print("✓ ")
	fmt.Printf(format+"\n", args...)
}

// PrintError prints an error message with X mark
func PrintError(format string, args ...any) {
	RedBold.Print("✗ ")
	fmt.Printf(format+"\n", args...)
}

// PrintInfo prints an info message with bullet
func PrintInfo(format string, args ...any) {
	CyanBold.Print("• ")
	fmt.Printf(format+"\n", args...)
}

// PrintWarning prints a warning message
func PrintWarning(format string, args ...any) {
	YellowBold.Print("⚠ ")
	fmt.Printf(format+"\n", args...)
}
