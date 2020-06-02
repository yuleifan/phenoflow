const chai = require("chai");
chai.use(require("chai-http"));
const server = require("../app");
const should = chai.should();
const expect = chai.expect;
const fs = require("fs");
const got = require("got");
const models = require("../models");
const logger = require("../config/winston");
const config = require("config");
const Workflow = require("./workflow");

describe("covid19", () => {

	describe("/POST create COVID-19 workflow", async() => {

		const USERNAME = "covid19-phenomics";

		it("Should be able to add a new user.", async() => {
			const result = await models.user.create({name: USERNAME, password: config.get("user.DEFAULT_PASSWORD"), verified: "true", homepage: "http://covid19-phenomics.org/"});
			result.should.be.a("object");
		});

		let workflowId;
		const name = "covid19";

		it("Create covid workflow.", async() => {
			workflowId = await Workflow.createWorkflow(name, "COVID-19 (coronavirus) phenotype identifying cohorts based on controlled clinical terminology terms.", USERNAME);
		});

		// 1. read-potential-cases

		let stepId;

		it("Add read potential cases step.", async() => {
			stepId = await Workflow.upsertStep(workflowId, 1, "read-potential-cases", "Read potential cases", "load", USERNAME);
		});

		it("Add read potential cases input.", async() => {
			await Workflow.input(stepId, "Potential cases of covid-19.", USERNAME);
		});

		it("Add read potential cases output.", async() => {
			await Workflow.output(stepId, "Initial potential cases, read from disc.", "csv", USERNAME);
		});

		it("Add read potential cases implementation.", async() => {
			await Workflow.implementation(stepId, "python", "test/implementation/python/covid19/", "read-potential-cases.py", USERNAME);
		});

		async function covidCode(code, step) {

			let stepId;

			it("Add " + code + " step.", async() => {
				stepId = await Workflow.upsertStep(workflowId, step, code.replace("-", "").toLowerCase(), "Use " + code + " codes to identify COVID-19 related events in a patient's electronic health record.", "logic", USERNAME);
			});

			it("Add " + code + " input.", async() => {
				await Workflow.input(stepId, "Potential cases of covid-19.", USERNAME);
			});

			it("Add " + code + " output.", async() => {
				await Workflow.output(stepId, "Patients with " + code + " codes indicating COVID-19 related events in electronic health record.", "csv", USERNAME);
			});

			it("Add " + code + " implementation.", async() => {
				await Workflow.implementation(stepId, "python", "test/implementation/python/covid19/", code.toLowerCase() + ".py", USERNAME);
			});

		}

		// 2 - 9. Codes
		covidCode("ICD-10", 2);
		covidCode("ICD-11", 3);
		covidCode("CTV3", 4);
		covidCode("EMIS", 5);
		covidCode("Vision", 6);
		covidCode("SNOMED-UK", 7);
		covidCode("SNOMED-INTL", 8);
		covidCode("LOINC", 9);

		// 8. output-cases

		it('Add output-cases step.', async() => {
			stepId = await Workflow.upsertStep(workflowId, 10, "output-cases", "Output cases.", "output", USERNAME);
		});

		it('Add output-cases input.', async() => {
			await Workflow.input(stepId, "Potential cases of covid-19.", USERNAME);
		});

		it('Add output-cases output.', async() => {
			await Workflow.output(stepId, "Output containing patients flagged as having covid-19.", "csv", USERNAME);
		});

		it('Add output-cases implementation.', async() => {
			await Workflow.implementation(stepId, "python", "test/implementation/python/covid19/", "output-cases.py", USERNAME);
		});

	});

});
