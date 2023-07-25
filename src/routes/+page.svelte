<script lang="ts">
    import { onMount } from "svelte";
    import { utilities } from "@cornerstonejs/core";
    import { utilities as csToolsUtilities } from "@cornerstonejs/tools";
    import {
        RenderingEngine,
        Enums,
        setVolumesForViewports,
        volumeLoader,
        getEnabledElement,
    } from '@cornerstonejs/core';
    import type { Types } from '@cornerstonejs/core';
    import type { Types as csToolsTypes } from '@cornerstonejs/tools';
    import {
        annotation,
        addTool,
        BrushTool,
        SegmentationDisplayTool,
        BidirectionalTool,
        LengthTool,
        ToolGroupManager,
        PanTool,
        StackScrollMouseWheelTool,
        StackScrollTool,
        WindowLevelTool,
        ZoomTool,
        segmentation,
        Enums as csToolsEnums,
        ArrowAnnotateTool,
    } from '@cornerstonejs/tools';
    import {
        initDemo,
        createImageIdsAndCacheMetaData,
        setTitleAndDescription,
    } from '$lib/helpers';

    const testAnnotation = {
      "highlighted": false,
      "invalidated": false,
      "metadata": {
        "toolName": "Length",
        "viewPlaneNormal": [
          0,
          0,
          -1
        ],
        "viewUp": [
          0,
          -1,
          0
        ],
        "FrameOfReferenceUID": "1.3.6.1.4.1.14519.5.2.1.7009.2403.490913010608778852675014095313",
        "referencedImageId": "wadors:https://d3t6nz73ql33tx.cloudfront.net/dicomweb/studies/1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463/series/1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561/instances/1.3.6.1.4.1.14519.5.2.1.7009.2403.185577707176119825195786015089/frames/1"
      },
      "data": {
        "handles": {
          "points": [
            [
              146.0140486357422,
              -29.138927605565158,
              -105.12000943554267
            ],
            [
              -71.36043988964843,
              63.08055237490361,
              -105.12000943554267
            ]
          ],
          "activeHandleIndex": null,
          "textBox": {
            "hasMoved": false,
            "worldPosition": [
              146.01404566591503,
              16.970812039492117,
              -105.12000943554267
            ],
            "worldBoundingBox": {
              "topLeft": [
                173.4603164997988,
                44.41708549802587,
                -105.12000943554267
              ],
              "topRight": [
                277.790464796155,
                44.41708549802587,
                -105.12000943554267
              ],
              "bottomLeft": [
                173.4603164997988,
                89.4289745361118,
                -105.12000943554267
              ],
              "bottomRight": [
                277.790464796155,
                89.4289745361118,
                -105.12000943554267
              ]
            }
          }
        },
        "label": "",
        "cachedStats": {
          "volumeId:cornerstoneStreamingImageVolume: myVolume": {
            "length": 236.1272977644543,
            "unit": "mm"
          }
        }
      },
      "annotationUID": "e4108d1c-ef20-42ad-930f-4812f435b59c",
      "isLocked": false,
      "isVisible": true
    } as csToolsTypes.Annotation;

    onMount(() => {
        const { ViewportType } = Enums;
        
        // Set up the page
        setTitleAndDescription('Basic Stack', 'Displays a single DICOM image in a Stack viewport.')

        const content = document.getElementById('content');

        const element = document.createElement('div');

        // Disable the default context menu so we can have right click tools without opening context menu
        element.oncontextmenu = (e) => e.preventDefault();

        element.id = 'cornerstone-element';
        element.style.width = '500px';
        element.style.height = '500px';

        content.appendChild(element);

        /**
         * Runs the demo
         */
        async function run() {
            // Init Cornerstone and related libraries
            await initDemo();

            // Get Cornerstone imageIds and fetch metadata into RAM
            const imageIds = await createImageIdsAndCacheMetaData({
                StudyInstanceUID:
                    '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
                SeriesInstanceUID:
                    '1.3.6.1.4.1.14519.5.2.1.7009.2403.226151125820845824875394858561',
                wadoRsRoot: 'https://d3t6nz73ql33tx.cloudfront.net/dicomweb',
            });

            // Instantiate a rendering engine
            const renderingEngineId = 'myRenderingEngine';
            const renderingEngine = new RenderingEngine(renderingEngineId);

            // Add the `cornerstoneStreamingImageVolume:`
            // to use the streaming volume loader
            const volumeId = 'cornerstoneStreamingImageVolume: myVolume';

            // Define a volume in memory
            const volume = await volumeLoader.createAndCacheVolume(volumeId, { imageIds });

            // Now create `viewport`s inside the renderingEngine using the `setViewports` API
            const viewportId = 'CT_AXIAL';

            const viewportInput = {
              viewportId: viewportId,
              element: element,
              type: ViewportType.ORTHOGRAPHIC,
              defaultOptions: {
                orientation: Enums.OrientationAxis.AXIAL,
              },
            };

            renderingEngine.enableElement(viewportInput);
            volume.load();
            setVolumesForViewports(
                renderingEngine,
                [{ volumeId }],
                [viewportId],
            );
            renderingEngine.renderViewports([viewportId]);

            // Add manipulation tools inside the `Cornerstone3DTools` internal state
            addTool(StackScrollMouseWheelTool);

            // Add annotation tools
            addTool(LengthTool);

            // Create a ToolGroup and add the tools
            // allows us to share tools between viewports
            const toolGroupId = 'myToolGroup';
            const toolGroup = ToolGroupManager.createToolGroup(toolGroupId);

            // Add tools to Cornerstone3D
            toolGroup.addTool(StackScrollMouseWheelTool.toolName);
            toolGroup.addTool(LengthTool.toolName);

            // Set the tool group on the viewport
            toolGroup.addViewport(viewportId, renderingEngineId);

            toolGroup.setToolActive(StackScrollMouseWheelTool.toolName);
            toolGroup.setToolActive(LengthTool.toolName, {
                bindings: [
                    {
                        mouseButton: csToolsEnums.MouseBindings.Primary, // left click
                    },
                ],
            });

            element.addEventListener('keydown', handleKeyPress);

            function handleKeyPress(e) {
              switch (e.code) {
                case 'Digit1':
                  if (!e.repeat) {
                    annotation.state.addAnnotation(testAnnotation, element);
                  }
                  break;
                case 'Digit2':
                  if (!e.repeat) {
                    const eventType = csToolsEnums.Events.ANNOTATION_ADDED;

                    const eventDetail: csToolsTypes.EventTypes.AnnotationAddedEventDetail = {
                      testAnnotation,
                      viewportId,
                      renderingEngineId: renderingEngine.id,
                    };

                    utilities.triggerEvent(element, eventType, eventDetail);
                  }
                  break;
                case 'Digit3':
                  if (!e.repeat) {
                    console.log(annotation.state.getAnnotations(LengthTool.toolName, element));
                  }
                  break;
                case 'Delete':
                  const selectedAnnotations = annotation.selection.getAnnotationsSelected();
                  for (const annotationUID of selectedAnnotations) {
                    annotation.state.removeAnnotation(annotationUID);
                    renderingEngine.render(); // refresh all viewports
                  }
                  break;
              }
            }

            element.addEventListener(csToolsEnums.Events.ANNOTATION_ADDED, (evt) => {
              console.log('annotation added');
            });
            content.addEventListener(csToolsEnums.Events.ANNOTATION_ADDED, (evt) => {
              console.log('annotation added');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_REMOVED, (evt) => {
              console.log('annotation removed');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_COMPLETED, (evt) => {
              console.log('annotation completed');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_MODIFIED, (evt) => {
              console.log('annotation modified');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_RENDERED, (evt) => {
              console.log('annotation rendered');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_VISIBILITY_CHANGE, (evt) => {
              console.log('annotation visibility change');
            });
            element.addEventListener(csToolsEnums.Events.ANNOTATION_SELECTION_CHANGE, (evt) => {
              console.log('annotation selection change');
            });
        }

        run();
    });
</script>

<!-- TODO -> Style the title and description components so they are the same in every demo-->
<div id="demo-title-container">
    <h1 id="demo-title">
    <!-- Insert demo title here during demo -->
    </h1>
</div>
<div id="demo-description-container">
    <p id="demo-description">
    <!-- Insert demo title here during demo -->
    </p>
</div>
<div id="demo-toolbar">
    <!-- Insert buttons/dropdowns/etc here during demo -->
</div>
<div id="content"></div>