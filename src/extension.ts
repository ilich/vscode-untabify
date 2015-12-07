import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {

	var tabify = vscode.commands.registerTextEditorCommand("tabify", (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
		var extension = new Untabify(editor);
		extension.execute(COMMAND.TABIFY);
	});

	var untabify = vscode.commands.registerTextEditorCommand("untabify", (editor: vscode.TextEditor, edit: vscode.TextEditorEdit) => {
		var extension = new Untabify(editor);
		extension.execute(COMMAND.UNTABIFY);
	});

	context.subscriptions.push(tabify);
	context.subscriptions.push(untabify);
}

enum COMMAND {
	TABIFY,
	UNTABIFY
};

const DEFAULT_SPACES_PER_TAB: number = 4;

class Untabify {
	private _editor: vscode.TextEditor;

	constructor(editor: vscode.TextEditor) {
		this._editor = editor;
	}

	execute(command: COMMAND) {
		if (this._editor === undefined) {
			return;
		}

		var config = vscode.workspace.getConfiguration("editor");
		var tabSize = config.get("tabSize", "auto");
		if (tabSize === "auto") {
			tabSize = DEFAULT_SPACES_PER_TAB.toString();
		}

		vscode.window.showInputBox({
			prompt: "How many spaces are in a single tab?",
			value: tabSize
		}).then((spacesPerTab) => {
			if (spacesPerTab === undefined) {
				return;
			}

			var spaces = parseInt(spacesPerTab);
			if (isNaN(spaces)) {
				spaces = DEFAULT_SPACES_PER_TAB;
			}

			switch(command) {
				case COMMAND.TABIFY:
					this.tabify(spaces);
					break;

				case COMMAND.UNTABIFY:
					this.untabify(spaces);
					break;
			}
		});
	}

	private tabify(spaces: number) {
		var re = new RegExp(`[ ]{${spaces}}`, "ig");
		var repl = "\t";

		this.updateContent(re, repl);
	}

	private untabify(spaces: number) {
		var re = /\t/ig;
		var repl = "";
		for (let i = 0; i < spaces; i++) {
			repl += " ";
		}

		this.updateContent(re, repl);
	}

	private updateContent(regex: RegExp, replacement: string) {
		if (this._editor === undefined) {
			return;
		}

		var e = this._editor;
		var lines = e.document.lineCount;
		var lastLine = e.document.lineAt(lines - 1);
		var start = new vscode.Position(0, 0);
		var end = new vscode.Position(lastLine.lineNumber, lastLine.text.length);
		var selection = new vscode.Selection(start, end);
		var text = e.document.getText();
		var fixedText = text.replace(regex, replacement);

		e.edit((builder) => {
			builder.replace(selection, fixedText);
		});
	}
}