import {ValidationBase} from "../helpers/validation/ValidationBase";
import {ParameterTypeModel} from "./ParameterTypeModel";
import {Serializable} from "../interfaces/Serializable";
import {UnimplementedMethodException} from "../helpers/UnimplementedMethodException";
import {CommandOutputBindingModel} from "./CommandOutputBindingModel";
import {ExpressionModel} from "./ExpressionModel";
import {Expression as V1Expression} from "../../mappings/v1.0/Expression";
import {Expression as SBDraft2Expression} from "../../mappings/d2sb/Expression";
import {EventHub} from "../helpers/EventHub";
import {ErrorCode} from "../helpers/validation/ErrorCode";
import {incrementLastLoc, isFileType} from "../helpers/utils";


export abstract class CommandOutputParameterModel extends ValidationBase implements Serializable<any> {
    /** Unique identifier of output */
    public id: string;
    /** Human readable short name */
    public label: string;
    /** Human readable description */
    public description: string;
    /** Description of file types expected for output to be */
    public fileTypes: string[];

    public secondaryFiles: ExpressionModel[] | any;

    public hasSecondaryFiles: boolean;
    public hasSecondaryFilesInRoot: boolean;

    /** Complex object that holds logic and information about output's type property */
    public type: ParameterTypeModel;

    /** Flag if output is field of a parent record. Derived from type */
    public isField: boolean;

    /** Binding for connecting output files and CWL output description */
    public outputBinding: CommandOutputBindingModel;

    public customProps: any = {};

    public updateOutputBinding(binding?: CommandOutputBindingModel) {
        new UnimplementedMethodException("updateOutputBinding", "CommandOutputParameterModel");
    }

    abstract addSecondaryFile(file: V1Expression | SBDraft2Expression | string): ExpressionModel;

    protected _addSecondaryFile<T extends ExpressionModel>(file: V1Expression | SBDraft2Expression | string,
                                exprConstructor: new (...args: any[]) => T,
                                locBase: string): T {

        const loc = incrementLastLoc(this.secondaryFiles, `${locBase}.secondaryFiles`);
        const f   = new exprConstructor(file, loc, this.eventHub);
        this.secondaryFiles.push(f);
        f.setValidationCallback(err => this.updateValidity(err));
        return f;
    }

    abstract updateSecondaryFiles(files: Array<V1Expression | SBDraft2Expression | string>);

    protected _updateSecondaryFiles(files: Array<V1Expression | SBDraft2Expression | string>) {
        this.secondaryFiles.forEach(f => f.clearIssue(ErrorCode.EXPR_ALL));
        this.secondaryFiles = [];
        files.forEach(f => this.addSecondaryFile(f));
    }

    abstract removeSecondaryFile(index: number);

    protected _removeSecondaryFile(index: number) {
        const file = this.secondaryFiles[index];
        if (file) {
            file.setValue("", "string");
            this.secondaryFiles.splice(index, 1);
        }
    }

    constructor(loc?: string, protected eventHub?: EventHub) {
        super(loc);
    }

    abstract serialize(): any;

    abstract deserialize(attr: any): void;

    updateLoc(loc: string) {
        // must update location of self first
        super.updateLoc(loc);

        // update location of type, so that in case the input is a field,
        // newly created fields will have correct loc
        this.type.updateLoc(`${loc}.type`);
    }

    validate(context): Promise<any> {
        this.clearIssue(ErrorCode.ALL);
        const promises = [];

        promises.push(this.outputBinding.validate(context));
        promises.push(this.type.validate(context));

        promises.concat(this.secondaryFiles.map(f => f.validate(context)));

        return Promise.all(promises).then(() => this.issues);
    }

    protected attachFileTypeListeners() {
        if (this.eventHub) {
            this.modelListeners.push(this.eventHub.on("io.change.type", (loc: string) => {
                if (`${this.loc}.type` === loc) {
                    if (!isFileType(this)) {
                        this.updateSecondaryFiles([]);
                        if (this.outputBinding) {
                            this.outputBinding.setInheritMetadataFrom(null);
                        }
                    }
                }
            }));
        }
    }
}
