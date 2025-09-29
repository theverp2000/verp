export const parse = function (tokens) {
  function start(tokens) {
		return tokens.reduce((content, token) => {
			//check operator positioning
			switch (token.type) {
				case "assigner":
				case "seperator":
				case "operator":
				case "arrow":
				case "number":
				case "name":
				case "tab":
				case "eol":
				case "carriagereturn":
				case "string":
				case "stringLiteral":
				case "assignee":
				case "statementseperator":
				case "inlinecomment":
				case "multilinecomment":
				case "space": {
						return content += token.value;
					}
				case "const":
				case "var":
				case "let":
				case "import":
					{
						return content += `${token.type}${start(token.value)}`;
					}
				case "params":
					{
						return content += `(${start(token.value)})`;
					}
				case "array":
					{
						return content += `[${start(token.value)}]`;
					}
				case "codeblock":
					{
						return content += `{${start(token.value)}}`;
					}
				default:
					{
						throw new TypeError('Unable to parse unknown type' + token.type);
					}
			}
		}, "");
	}

  return start(tokens);
}
