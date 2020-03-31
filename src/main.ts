import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs";
import * as path from "path";

async function run(): Promise<void> {
    try {
        // Add the CLI to the environment path.
        const censorPath = path.normalize(`${__dirname}\\..\\node_modules\\peeky\\CensorCheck`);
        core.addPath(censorPath);

        // Retrieve the PAT Token and the github workspace.
        // Get required input arguments.
        let censoredWords: string = "";
        try {
            // When 'required' is sent as true, git/core will
            // throw when the argument is not found.
            censoredWords = core.getInput("censored", { required: true });

            // If the retrieved pat is an empty string, we throw to print the warning end return.
            if (!censoredWords) {
                throw Error;
            }
        } catch (error) {
            core.warning(`Could not find censored keywords.`);
            return;
        }

        const directory = process.env.GITHUB_WORKSPACE;

        // Validate directory
        if (directory == null) {
            // If the environment variable is not set, this could mean that the
            // github action is running on a different environment other than
            // the one github provides.
            throw Error("A workspace directory was not found in the current CI environment.");
        } else {
            if (!fs.existsSync(directory)) {
                // If the workspace directory doesn't exists we can't train anything.
                // An error is thrown to notice the reason of failure.
                throw Error("Workspace directory doesn't exists in the file system.");
            }
        }

        const isWin = process.platform === "win32";
        const isLinux = process.platform === "linux";

        if (!isWin && !isLinux) {
            core.warning("OS is not supported");
            return;
        }

        // Execute the CLI with the given arguments.
        if (isWin) {
            const args = [directory, censoredWords];
            exec.exec("CensorCheck.exe", args).catch((e) => {
                throw new Error(e);
            });
        } else {
            const dllDir = path.join(censorPath, "CensorCheck.dll");
            const args = [dllDir, directory, censoredWords];
            exec.exec("dotnet", args).catch((e) => {
                throw new Error(e);
            });
        }
    } catch (error) {
        // If an unhandled exception is thrown
        // an error message is logged.
        // This allows the pipeline to continue and also notifies
        // the user that something went wrong on the intellicode model training.
        core.error(error.message);
    }
}

run();
