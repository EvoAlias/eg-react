import React from 'react';
import SelectConfig from './SelectConfig';
import NumberConfig from './NumberConfig';
/**
 * A context menu item that configures interaction track score scale.
 * 
 * @param {Object} props - props as specified by React
 * @return {JSX.Element} element to render
 */
function ScoreConfig(props) {
    const fixedScales = props.optionsObjects[0].scoreScale === 'fixed' ? <React.Fragment>
        <NumberConfig {...props} 
            optionName="scoreMax" 
            label="Score max:" 
            isFloat={true} 
            hasSetButton={true}
        />
        <NumberConfig {...props} 
            optionName="scoreMin" 
            label="Score min:" 
            isFloat={true} 
            hasSetButton={true}
        />
    </React.Fragment> : null;
    return (
        <React.Fragment> 
            <SelectConfig 
                {...props} 
                optionName="scoreScale" 
                label="Score scale:" 
                choices={{
                    AUTO: "auto",
                    FIXED: "fixed",
                }}
                defaultValue="auto"
            />
            {fixedScales}
            
        </React.Fragment> 
    );
}

export default ScoreConfig;
