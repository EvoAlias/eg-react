import GridVert from '!raw-loader!./grid_main.vert';
import GridFragHelpersStub from '!raw-loader!./grid_helpers.stub.frag';
import GridFragMainStub from '!raw-loader!./grid_main.stub.frag';
import GridFragParamsStub from '!raw-loader!./grid_params.stub.frag';
import GridFragScaleStub from '!raw-loader!./grid_scale_proj.stub.frag';

import GridFragTransformCartesianStub from '!raw-loader!./transforms/grid_transform_cartesian.stub.frag';
import GridFragTransformPolarStub from '!raw-loader!./transforms/grid_transform_polar.stub.frag';

export const GridVertCode = GridVert;
export const GridFragCartesianCode = 
`
${GridFragParamsStub}
${GridFragHelpersStub}
${GridFragTransformCartesianStub}
${GridFragScaleStub}
${GridFragMainStub}
`