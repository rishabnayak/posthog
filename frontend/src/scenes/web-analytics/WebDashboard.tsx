import { Query } from '~/queries/Query/Query'
import { useActions, useValues } from 'kea'
import { webAnalyticsLogic } from 'scenes/web-analytics/webAnalyticsLogic'
import { PropertyFilters } from 'lib/components/PropertyFilters/PropertyFilters'
import { TaxonomicFilterGroupType } from 'lib/components/TaxonomicFilter/types'
import { isEventPropertyFilter } from 'lib/components/PropertyFilters/utils'
import {
    NodeKind,
    QueryContext,
    QueryContextColumnComponent,
    QueryContextColumnTitleComponent,
    WebStatsBreakdown,
} from '~/queries/schema'
import { useCallback } from 'react'
import { UnexpectedNeverError } from 'lib/utils'

const PercentageCell: QueryContextColumnComponent = ({ value }) => {
    if (typeof value === 'number') {
        return (
            <div className="w-full text-right">
                <span className="flex-1 text-right">{`${(value * 100).toFixed(1)}%`}</span>
            </div>
        )
    } else {
        return null
    }
}

const NumericCell: QueryContextColumnComponent = ({ value }) => {
    return (
        <div className="w-full text-right">
            <span className="flex-1 text-right">{String(value)}</span>
        </div>
    )
}

const BreakdownValueTitle: QueryContextColumnTitleComponent = (props) => {
    const { query } = props
    const { source } = query
    if (source.kind !== NodeKind.WebStatsTableQuery) {
        return null
    }
    const { breakdownBy } = source
    switch (breakdownBy) {
        case WebStatsBreakdown.Page:
            return <>Path</>
        case WebStatsBreakdown.InitialPage:
            return <>Initial Path</>
        case WebStatsBreakdown.InitialReferringDomain:
            return <>Referring Domain</>
        case WebStatsBreakdown.InitialUTMSource:
            return <>UTM Source</>
        case WebStatsBreakdown.InitialUTMCampaign:
            return <>UTM Campaign</>
        case WebStatsBreakdown.Browser:
            return <>Browser</>
        case WebStatsBreakdown.OS:
            return <>OS</>
        case WebStatsBreakdown.DeviceType:
            return <>Device Type</>
        default:
            throw new UnexpectedNeverError(breakdownBy)
    }
}
const BreakdownValueCell: QueryContextColumnComponent = (props) => {
    const { value, query } = props
    const { togglePropertyFilter } = useActions(webAnalyticsLogic)
    const { source } = query
    if (source.kind !== NodeKind.WebStatsTableQuery) {
        return null
    }
    if (typeof value !== 'string') {
        return null
    }
    const { breakdownBy } = source
    let propertyName: string
    switch (breakdownBy) {
        case WebStatsBreakdown.Page:
            propertyName = '$pathname'
            break
        case WebStatsBreakdown.InitialPage:
            propertyName = '$initial_pathname'
            break
        case WebStatsBreakdown.InitialReferringDomain:
            propertyName = '$initial_referrer'
            break
        case WebStatsBreakdown.InitialUTMSource:
            propertyName = '$initial_utm_source'
            break
        case WebStatsBreakdown.InitialUTMCampaign:
            propertyName = '$initial_utm_campaign'
            break
        case WebStatsBreakdown.Browser:
            propertyName = '$browser'
            break
        case WebStatsBreakdown.OS:
            propertyName = '$os'
            break
        case WebStatsBreakdown.DeviceType:
            propertyName = '$device_type'
            break
        default:
            throw new UnexpectedNeverError(breakdownBy)
    }

    const onClick = useCallback(() => {
        togglePropertyFilter(propertyName, value)
    }, [togglePropertyFilter, propertyName, value])

    return <a onClick={onClick}>{value}</a>
}

const queryContext: QueryContext = {
    columns: {
        breakdown_value: {
            renderTitle: BreakdownValueTitle,
            render: BreakdownValueCell,
        },
        bounce_rate: {
            title: 'Bounce Rate',
            render: PercentageCell,
        },
        views: {
            title: 'Views',
            render: NumericCell,
        },
        visitors: {
            title: 'Visitors',
            render: NumericCell,
        },
    },
}

export const WebAnalyticsDashboard = (): JSX.Element => {
    const { tiles, webAnalyticsFilters } = useValues(webAnalyticsLogic)
    const { setWebAnalyticsFilters } = useActions(webAnalyticsLogic)
    return (
        <div>
            <div className="sticky top-0 bg-white z-20 pt-2">
                <PropertyFilters
                    taxonomicGroupTypes={[TaxonomicFilterGroupType.EventProperties]}
                    onChange={(filters) => setWebAnalyticsFilters(filters.filter(isEventPropertyFilter))}
                    propertyFilters={webAnalyticsFilters}
                    pageKey={'web-analytics'}
                />
                <div className={'bg-border h-px w-full mt-2'} />
            </div>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                {tiles.map((tile, i) => {
                    if ('query' in tile) {
                        const { query, title, layout } = tile
                        return (
                            <div
                                key={i}
                                className={`col-span-1 row-span-1 md:col-span-${layout.colSpan ?? 6} md:row-span-${
                                    layout.rowSpan ?? 1
                                } min-h-100 flex flex-col`}
                            >
                                {title && <h2>{title}</h2>}
                                <Query query={query} readOnly={true} context={queryContext} />
                            </div>
                        )
                    } else if ('tabs' in tile) {
                        const { tabs, activeTabId, layout, setTabId } = tile
                        const tab = tabs.find((t) => t.id === activeTabId)
                        if (!tab) {
                            return null
                        }
                        const { query, title } = tab
                        return (
                            <div
                                key={i}
                                className={`col-span-1 row-span-1 md:col-span-${layout.colSpan ?? 6} md:row-span-${
                                    layout.rowSpan ?? 1
                                } min-h-100 flex flex-col`}
                            >
                                <div className="flex flex-row items-center">
                                    {<h2 className="flex-1 m-0">{title}</h2>}
                                    {tabs.length > 1 && (
                                        <div className="space-x-2">
                                            {/* TODO switch to a select if more than 3 */}
                                            {tabs.map(({ id, linkText }) => (
                                                <a
                                                    className={
                                                        id === activeTabId
                                                            ? 'text-link'
                                                            : 'text-inherit hover:text-link'
                                                    }
                                                    key={id}
                                                    onClick={() => setTabId(id)}
                                                >
                                                    {linkText}
                                                </a>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                {/* Setting key forces the component to be recreated when the tab changes */}
                                <Query key={activeTabId} query={query} readOnly={true} context={queryContext} />
                            </div>
                        )
                    } else {
                        return null
                    }
                })}
            </div>
        </div>
    )
}
