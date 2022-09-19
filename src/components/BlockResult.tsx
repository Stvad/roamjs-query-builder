import getShallowTreeByParentUid from 'roamjs-components/queries/getShallowTreeByParentUid'
import deleteBlock from 'roamjs-components/writes/deleteBlock'
import {Result} from 'roamjs-components/types/query-builder'
import createBlock from 'roamjs-components/writes/createBlock'
import React, {useEffect} from 'react'
import {CellEmbed} from './ResultsView'

async function deleteAllChildren(blockUid: string) {
    await Promise.all(getShallowTreeByParentUid(blockUid).map((b) => deleteBlock(b.uid)))
}

function createResultBlocks(timelineElements: Result[], parentUid: string) {
    timelineElements.forEach((block, index) => {
        createBlock({
            node: {
                text: `{{embed-path: ((${block.uid})) }}`,
            },
            parentUid,
            order: index,
        })
    })
}

export const BlockResult = ({timelineElements, blockUid}: { timelineElements: Result[], blockUid: string }) => {
    // todo show loading indicator before results are ready

    useEffect(() => {
        (async () => {
            await deleteAllChildren(blockUid)
            createResultBlocks(timelineElements, blockUid)
        })()
    }, [timelineElements, blockUid])

    return <div>
        <h3>{timelineElements.length} results</h3>
        <CellEmbed uid={blockUid}/>
    </div>
}
