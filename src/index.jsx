import React, { Fragment } from "react";
import ReactDOM from "react-dom";
import { Form } from "react-bootstrap";
import { Typeahead } from "react-bootstrap-typeahead";
import "react-bootstrap-typeahead/css/Typeahead.css";
import "./styles.css";
import { useState, useEffect } from "react";
import copy from 'copy-to-clipboard';

//get from gateway API, each object should contain type, label, op (optional)
const options = [
	{
		type: "kef",			// should make some cons here 
		label: "alert_type",
		op: [
			">",
			"<",
			"=",
			"~"
		]
	},
	{
		type: "kef",
		label: "alert_time",
		op: [
			">",
			"<",
			"=",
			"~"
		]
	},
	{
		type: "kef",
		label: "is_escalated",
		op: [
			">",
			"<",
			"=",
			"~"
		]
	},
	{
		type: "op",
		label: ">"
	},
	{
		type: "op",
		label: "<"
	},
	{
		type: "op",
		label: "~"
	},
	{
		type: "op",
		label: "==="
	},
	{
		type: "op",
		label: "!="
	},
	{
		type: "op",
		label: "=="
	},
	{
		type: "expr-op",
		label: "AND"
	},
	{
		type: "expr-op",
		label: "OR"
	},
	{
		type: "value",
		label: "ESCLATED"
	},
	{
		type: "value",
		label: "ANOMALY"
	},
	{
		type: "value",
		label: "RISK_SESSION"
	}
];

const App = () => {
	const [isValid, setIsValid] = useState(false);
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("Get Query from URL here");				// query string to call ES, default should get from URL 
	const [typeAheadSelected, setTypeAheadSelected] = useState([]) 				// selected, always sync typeAheadSelected <-> query 

	const onFocus = () => {
		setOpen(true);
	};
	const onBlur = () => {
		setOpen(false);
	};

	const getValuefromForm = (value) => {
		let _value = "";
		value.forEach((item) => {
			if (typeof item === "string") {
				_value += item + " ";
			} else {
				_value += item.label + " ";
			}
		});
		return _value;
	};

	// Validate and render feedback
	useEffect(() => {
		console.log("final query changed, calling validate");
		console.log(query);
		//TODO: Calling API instead
		if (Math.random() < 0.5) {
			setIsValid(true);
		} else {
			setIsValid(false);
		}
	}, [query]);


	// Trying to split a custom label using ES operator and AND/OR 
	const customSplit = (label) => {
		const delimeter = options.filter(opt => opt?.type === "op" || opt?.type === "expr-op").sort((x, y) => y.label.length - x.label.length);  //THIS SORT IS IMPORTANT TO PRIORITY TOKEN 
		const multiDelimeter = delimeter.map(delimeter => delimeter.label)

		// TODO 
		return label.split("")
	}


	const onChange = (value) => {
		console.log('Changed input query', value)
		const current_query = getValuefromForm(value);

		const splitted = value.map(v => customSplit(v.label)).flat()
		console.log(splitted)

		setQuery(current_query);							// set query according to input field 
		setTypeAheadSelected(splitted.map(token => {
			const tokenInOptions = options.find(opt => opt.label.toLowerCase().trim() === (token?.trim()?.toLowerCase()))

			// Token === Options -> use its type and label and other option ...tokenInOptions
			// else -> use as customOption
			if (tokenInOptions !== undefined) {
				return {
					...tokenInOptions,
				}
			} else {
				return {
					label: token,
					customOption: true
				}
			}

		}))
	};

	const suggest = (option, props) => {
		// What to suggest here
		//console.log("Customize suggest here");
		//console.log(option, props);
		if (props.selected.length === 0) {
			const currentInputToken = props.text || ""				// First item only suggest kef field 
			if (option.type === "kef" && option.label.toLowerCase().includes(currentInputToken.toLowerCase())) return true;
			else return false;
		} else {
			const lastToken = props.selected[props.selected.length - 1];				// After that, suggest based on previous field
			const currentInputToken = props.text || ""

			if (lastToken.type === "kef") {		// last=kef -> suggest option that in list  kef.op 
				console.log("lastToken KEF", lastToken)
				if (lastToken?.op?.includes(option.label.toLowerCase())) {
					return true
				}
				else {
					return false
				}
			}
			else if (lastToken.type === "op") {		// last=op -> suggest value that option matching 
				console.log("lastToken OP", lastToken)
				if (option.type === "value") { // we can do better here, check previous lastToken to get kef field and suggest correspond value like ANOMALY ..
					if (option.label.toLowerCase().includes(currentInputToken.toLowerCase())) return true			// suggest value that option matching 
					return false
				}
				else return false
			}
			else if (lastToken.type === "expr-op") {		// last=AND/OR -> suggest kef 
				console.log("lastToken EXPR-OP", lastToken)
				if (option.type === "kef") return true
				else return false
			} else if (lastToken.type === "value") {			// last=pre-defined value 
				console.log("lastToken VALUE", lastToken)
				if (option.type === "expr-op") return true
				else return false
			} else if (lastToken.type === undefined || lastToken?.customOption === true) {		// user custom enter -> if custom enter is new KEY (only if prev of lastToken is null or is an expr-op) => suggest op, if custome enter is new Value => suggest AND/OR
				console.log("Dont know who i am", lastToken, props.selected)

				// user custom KEY field
				const prevLastToken = props.selected[props.selected.length - 2];
				if (prevLastToken === undefined) {
					if (option.type === "op") return true
					else return false
				} else if (prevLastToken.type === "expr-op") {
					if (option.type === "op") return true
					else return false
				} else if (prevLastToken.type === undefined || prevLastToken?.customOption === true) {			// two consecutive customOption -> we dont know what to suggest -> suggest all
					console.log('hiiiiiiiiiiiiiiiiiiiiiiiiii')
					return true
				}

				// user custome value 
				if (option.type === "expr-op") return true
				else return false
			}

			// return true at last
			return true
		}
	}

	const copyToClipboard = () => {
		copy(query)
	}


	return (
		<Fragment>
			<Form.Group>
				<Typeahead
					//defaultSelected= {[]}
					allowNew
					className="is-invalid"
					id="invalid-styles-example"
					isInvalid={isValid}
					options={options}
					multiple
					newSelectionPrefix=""
					open={open} // fix so only open = true when input got focus
					onChange={onChange}
					onFocus={onFocus}
					onBlur={onBlur}
					selectHintOnEnter={true}
					emptyLabel={<>enter some value</>}
					// renderToken={(option, props, index) => {      // Customize render UI 
					//   console.log('Render Token')
					//   console.log(option, props, index )
					//   return " " + (option?.label || option) + " "
					// }}
					filterBy={suggest}
					selected={typeAheadSelected}
					clearButton={true}
				/>
			</Form.Group>
			<h1>Query: {query || "Empty"}</h1>
			<button onClick={copyToClipboard}>Click to Copy to Clipboard</button>
		</Fragment>
	);
};

ReactDOM.render(<App />, document.getElementById("root"));
