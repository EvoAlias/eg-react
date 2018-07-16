# ECS
- Build simple ECS system - Done
    - Component manipulation for Entities - DONE
    - Entity manipulation for systems - DONE
    - fixed update - DONE
- Enable consistent fixedupdate for all systems
    - Systems should be able to rate limit to 30fps - DONE
    - Remove Pre and Post update - DONE

## Genome Tree
- Create interval tree to represent genome - Done
- Add basic repositioning routine - Done

## GenomeModel System
- Render a chromosome in Linear, Circular, and String orientation - DONE
- Create a directional track shader for chromosomes.

## HI-C System
- Add basic orientation routine from HI-C data
- Add routine to load and unload segments of the genome.

## Gene Rendering System
- Come up with a set of objects to represent the following of a gene
    - Transcription Region
    - Exons
    - Introns
    - CDS

## Numeric Track System
- **IMPORTANT** Turns out 1 chart for every selected component is bogging down the sytem
- We need to take all selected entites and draw one big chart.
- Convert Tracks from SVG to textures that map to chart
- Build out simple line chart component
    - [Optional] use shaders to generate a grid and spline. Map domain to the uv coordinates
    - [Optional] use canvas to generate chart. Convert canvas to a textue for use with the plane: DONE
- Get charts to map to the uvs of a plane: Done
- Create Tooltip and Cursors
- Orient plane to the transform based off the genome tree - DONE

## Selection System
- Allow components to get picked by clicking on their entities or flagging entities that are picked. - DONE
- Box Select - DONE

## CameraSystem
- Allow camera to fly through different parts of genome - DONE

## UI
- Create a Floor - DONE
- Create a canvas and panel system for drawing arbitrary windows to the screen.
- Enable charts to move from the genome view to the UI.
